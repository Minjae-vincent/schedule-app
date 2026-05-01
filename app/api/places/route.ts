import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/kakao/places'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('query') ?? ''
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (!query || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ ok: false, error: '파라미터가 누락됐습니다.' }, { status: 400 })
  }

  try {
    const data = await searchPlaces(query, lat, lng)
    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
