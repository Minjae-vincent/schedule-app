import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { VALID_HOURS } from '@/types/domain'
import type { TimeSlot } from '@/types/domain'

const VALID_SLOT_SET = new Set(VALID_HOURS)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const nickname = searchParams.get('nickname')

    if (!token || !nickname) {
      return NextResponse.json({ ok: false, error: '필수 파라미터가 누락됐습니다.' }, { status: 400 })
    }

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('invite_token', token)
      .single()

    if (!group) {
      return NextResponse.json({ ok: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('group_id', group.id)
      .eq('nickname', nickname.trim())
      .single()

    if (!member) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const { data: votes, error } = await supabaseAdmin
      .from('date_votes')
      .select('vote_date, time_slots')
      .eq('member_id', member.id)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: votes ?? [] })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      invite_token: string
      nickname: string
      votes: { vote_date: string; time_slots: string[] }[]
    }

    const { invite_token, nickname, votes } = body

    if (!invite_token || !nickname?.trim()) {
      return NextResponse.json({ ok: false, error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    // 유효하지 않은 time_slot 값 필터링
    const sanitizedVotes = votes.map(v => ({
      ...v,
      time_slots: v.time_slots.filter((s): s is TimeSlot => VALID_SLOT_SET.has(s)),
    }))

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('invite_token', invite_token)
      .single()

    if (!group) {
      return NextResponse.json({ ok: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('group_id', group.id)
      .eq('nickname', nickname.trim())
      .single()

    if (!member) {
      return NextResponse.json({ ok: false, error: '참여자를 찾을 수 없습니다.' }, { status: 404 })
    }

    await supabaseAdmin.from('date_votes').delete().eq('member_id', member.id)

    if (sanitizedVotes.length > 0) {
      const rows = sanitizedVotes.map(v => ({
        group_id: group.id,
        member_id: member.id,
        vote_date: v.vote_date,
        time_slots: v.time_slots,
      }))

      const { error } = await supabaseAdmin.from('date_votes').insert(rows)
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
