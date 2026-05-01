import { NextRequest, NextResponse } from 'next/server'
import { fetchWeatherForDate } from '@/lib/weather/client'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const date = searchParams.get('date') ?? ''

  if (isNaN(lat) || isNaN(lng) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: '잘못된 파라미터입니다.' }, { status: 400 })
  }

  try {
    const data = await fetchWeatherForDate(lat, lng, date)
    if (!data) {
      return NextResponse.json({ ok: false, error: '날씨 정보를 불러올 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
