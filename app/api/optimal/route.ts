import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calcMidpoint, getNearestRegions } from '@/lib/kakao/midpoint'

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token')
    if (!token) {
      return NextResponse.json({ ok: false, error: '그룹 토큰이 필요합니다.' }, { status: 400 })
    }

    const { data: group } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('invite_token', token)
      .single()

    if (!group) {
      return NextResponse.json({ ok: false, error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: members } = await supabaseAdmin
      .from('members')
      .select('nickname, origin_lat, origin_lng')
      .eq('group_id', group.id)
      .not('origin_lat', 'is', null)
      .not('origin_lng', 'is', null)

    const coords = (members ?? []).map(m => ({
      lat: m.origin_lat as number,
      lng: m.origin_lng as number,
    }))

    const midpoint = calcMidpoint(coords)
    const regions = getNearestRegions(midpoint)

    return NextResponse.json({
      ok: true,
      data: {
        midpoint,
        memberCount: coords.length,
        regions,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
