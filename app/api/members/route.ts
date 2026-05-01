import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      invite_token: string
      nickname: string
    }

    const { invite_token, nickname } = body

    if (!invite_token || !nickname?.trim()) {
      return NextResponse.json({ ok: false, error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('invite_token', invite_token)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ ok: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: existing } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('group_id', group.id)
      .eq('nickname', nickname.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: false, error: '이미 사용 중인 닉네임입니다.' }, { status: 409 })
    }

    const { data, error } = await supabaseAdmin
      .from('members')
      .insert({ group_id: group.id, nickname: nickname.trim() })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
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
      nickname: string
      origin_address: string
      origin_lat: number
      origin_lng: number
    }

    const { invite_token, nickname, origin_address, origin_lat, origin_lng } = body

    if (!invite_token || !nickname?.trim() || !origin_address) {
      return NextResponse.json({ ok: false, error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    if (typeof origin_lat !== 'number' || typeof origin_lng !== 'number') {
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
      .from('members')
      .update({ origin_address, origin_lat, origin_lng })
      .eq('group_id', group.id)
      .eq('nickname', nickname.trim())

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
