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
