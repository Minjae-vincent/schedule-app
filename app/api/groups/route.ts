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
    }

    const { name, creator_nickname, date_range_start, date_range_end } = body

    if (!name || !creator_nickname || !date_range_start || !date_range_end) {
      return NextResponse.json({ ok: false, error: '필수 항목이 누락됐습니다.' }, { status: 400 })
    }

    if (new Date(date_range_start) > new Date(date_range_end)) {
      return NextResponse.json({ ok: false, error: '날짜 범위가 올바르지 않습니다.' }, { status: 400 })
    }

    const invite_token = nanoid(10)

    const { data, error } = await supabaseAdmin
      .from('groups')
      .insert({ name, creator_nickname, date_range_start, date_range_end, invite_token })
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
