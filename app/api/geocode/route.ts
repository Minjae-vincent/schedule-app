import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/kakao/client'

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q')
    if (!q) {
      return NextResponse.json({ ok: false, error: '주소가 필요합니다.' }, { status: 400 })
    }

    if (!process.env.KAKAO_REST_API_KEY) {
      console.error('[geocode] KAKAO_REST_API_KEY is not set')
      return NextResponse.json({ ok: false, error: '서버 설정 오류: 카카오 API 키가 없습니다.' }, { status: 500 })
    }

    const result = await geocodeAddress(q)
    if (!result) {
      console.error('[geocode] no result for:', q)
      return NextResponse.json({ ok: false, error: '좌표를 찾을 수 없습니다.' }, { status: 422 })
    }

    return NextResponse.json({ ok: true, data: result })
  } catch (e) {
    console.error('[geocode] unexpected error:', e)
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
