import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('invite_token', token)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ ok: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id, nickname, created_at')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true })

    if (membersError) {
      return NextResponse.json({ ok: false, error: membersError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: { ...group, members: members ?? [] } })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
