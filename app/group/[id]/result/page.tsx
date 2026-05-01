import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyLinkButton } from '@/components/group/CopyLinkButton'
import { supabaseAdmin } from '@/lib/supabase/server'
import { fetchWeatherForDate } from '@/lib/weather/client'
import { getSuggestion } from '@/lib/recommendation/suggest'
import { searchPlaces } from '@/lib/kakao/places'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`
}

const WEATHER_EMOJI: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: token } = await params

  const { data: group } = await supabaseAdmin
    .from('groups')
    .select('*')
    .eq('invite_token', token)
    .single()

  if (!group || group.status !== 'confirmed') notFound()

  const confirmedDate = group.confirmed_date as string
  const confirmedRegion = group.confirmed_region as string
  const confirmedLat = group.confirmed_lat as number
  const confirmedLng = group.confirmed_lng as number

  const [{ data: members }, weather] = await Promise.all([
    supabaseAdmin
      .from('members')
      .select('id, nickname')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true }),
    fetchWeatherForDate(confirmedLat, confirmedLng, confirmedDate).catch(() => null),
  ])

  const suggestion = weather ? getSuggestion(weather.main, weather.temp) : null

  // 날씨 기반 1순위 키워드로 장소 검색
  let places: Awaited<ReturnType<typeof searchPlaces>> = []
  if (suggestion && confirmedLat && confirmedLng) {
    places = await searchPlaces(
      `${confirmedRegion} ${suggestion.keywords[0]}`,
      confirmedLat,
      confirmedLng,
    ).catch(() => [])
  }

  const memberList = members ?? []

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="max-w-md w-full space-y-5">
        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <Badge>확정</Badge>
          </div>
          <p className="text-sm text-gray-500">주최자: {group.creator_nickname}</p>
        </div>

        {/* 확정 날짜·장소 */}
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-800">확정된 약속</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-semibold text-gray-900">{formatDate(confirmedDate)}</p>
                <p className="text-xs text-gray-500">{formatShort(confirmedDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <p className="font-semibold text-gray-900">{confirmedRegion}</p>
            </div>
          </CardContent>
        </Card>

        {/* 날씨 */}
        {weather ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">당일 날씨 예보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{WEATHER_EMOJI[weather.main] ?? '🌡️'}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{weather.temp}°C</p>
                  <p className="text-sm text-gray-500">{weather.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-gray-400">
                날씨 예보는 확정일 5일 이내에만 제공됩니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* 활동 추천 */}
        {suggestion && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">추천 활동</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">{suggestion.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestion.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 추천 장소 */}
        {places.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">근처 추천 장소</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">{confirmedRegion} 반경 2km</p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {places.map((p, i) => (
                  <li key={p.id} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                      >
                        {p.name}
                      </a>
                      <p className="text-xs text-gray-400 truncate">{p.address}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* 참여 멤버 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">참여 멤버 ({memberList.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {memberList.map((m) => (
                <span
                  key={m.id}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 text-xs px-3 py-1"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    {m.nickname[0]}
                  </span>
                  {m.nickname}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 공유 링크 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">결과 공유</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded p-2 break-all">
              /group/{token}/result
            </p>
            <CopyLinkButton token={token} path="result" />
          </CardContent>
        </Card>

        <Link
          href={`/group/${token}`}
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  )
}
