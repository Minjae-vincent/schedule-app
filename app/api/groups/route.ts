import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name: string
      creator_nickname: string
      date_range_start: string
      date_range_end: string
      vote_mode?: 'date_only' | 'date_time'
    }

    const { name, creator_nickname, date_range_start, date_range_end, vote_mode = 'date_only' } = body

    if (!name || !creator_nickname || !date_range_start || !date_range_end) {
      return NextResponse.json({ ok: false, error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    if (new Date(date_range_start) > new Date(date_range_end)) {
      return NextResponse.json({ ok: false, error: '날짜 범위가 올바르지 않습니다.' }, { status: 400 })
    }

    if (vote_mode !== 'date_only' && vote_mode !== 'date_time') {
      return NextResponse.json({ ok: false, error: '유효하지 않은 투표 모드입니다.' }, { status: 400 })
    }

    const invite_token = nanoid(10)

    const { data, error } = await supabaseAdmin
      .from('groups')
      .insert({ name, creator_nickname, date_range_start, date_range_end, invite_token, vote_mode })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const { error: memberError } = await supabaseAdmin
      .from('members')
      .insert({ group_id: data.id, nickname: creator_nickname })

    if (memberError) {
      return NextResponse.json({ ok: false, error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      invite_token: string
      confirmed_date: string
      confirmed_region: string
      confirmed_lat: number
      confirmed_lng: number
    }

    const { invite_token, confirmed_date, confirmed_region, confirmed_lat, confirmed_lng } = body

    if (!invite_token || !confirmed_date || !confirmed_region) {
      return NextResponse.json({ ok: false, error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    if (typeof confirmed_lat !== 'number' || typeof confirmed_lng !== 'number') {
      return NextResponse.json({ ok: false, error: '좌표 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('invite_token', invite_token)
      .single()

    if (!group) {
      return NextResponse.json({ ok: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('groups')
      .update({ status: 'confirmed', confirmed_date, confirmed_region, confirmed_lat, confirmed_lng })
      .eq('id', group.id)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
