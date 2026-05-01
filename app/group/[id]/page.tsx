import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyLinkButton } from '@/components/group/CopyLinkButton'
import { AutoRefresh } from '@/components/group/AutoRefresh'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getDatesInRange, getTopDates } from '@/lib/date/optimal'
import { calcMidpoint, getNearestRegions } from '@/lib/kakao/midpoint'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConfirmFlow } from '@/components/group/ConfirmFlow'
export const dynamic = 'force-dynamic'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatHour(h: string) {
  return `${parseInt(h, 10)}시`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`
}

export default async function GroupDashboardPage({
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

  if (!group) notFound()

  const [{ data: members }, { data: allVotes }] = await Promise.all([
    supabaseAdmin
      .from('members')
      .select('id, nickname, created_at, origin_address, origin_lat, origin_lng')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('date_votes')
      .select('vote_date, time_slots, member_id')
      .eq('group_id', group.id),
  ])

  const memberList = members ?? []
  const votes = allVotes ?? []
  const memberCount = memberList.length

  const dates = getDatesInRange(group.date_range_start, group.date_range_end)
  const topDates = getTopDates(votes)

  // 멤버 ID → 닉네임 맵
  const memberMap = new Map(memberList.map(m => [m.id, m.nickname]))

  // 출발지 입력한 멤버만 필터링 → 중간 지점 계산
  const membersWithOrigin = memberList.filter(
    m => m.origin_lat != null && m.origin_lng != null,
  )
  const midpoint = calcMidpoint(
    membersWithOrigin.map(m => ({ lat: m.origin_lat as number, lng: m.origin_lng as number })),
  )
  const recommendedRegions = getNearestRegions(midpoint)

  // 날짜별 가능 인원 집계
  const voteMap = new Map<string, number>()
  for (const date of dates) voteMap.set(date, 0)
  for (const vote of votes) {
    voteMap.set(vote.vote_date, (voteMap.get(vote.vote_date) ?? 0) + 1)
  }

  const hasAnyVotes = votes.length > 0

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <AutoRefresh />
      <div className="max-w-md w-full space-y-5">
        {/* 헤더 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <Badge variant={group.status === 'confirmed' ? 'default' : 'secondary'}>
              {group.status === 'confirmed' ? '확정' : '투표 중'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            주최자: {group.creator_nickname} · {formatDate(group.date_range_start)} ~ {formatDate(group.date_range_end)}
          </p>
        </div>

        {/* 초대 링크 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">초대 링크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded p-2 break-all">
              /group/{token}/join
            </p>
            <CopyLinkButton token={token} />
          </CardContent>
        </Card>

        {/* 추천 날짜 Top 3 */}
        {hasAnyVotes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">추천 날짜 Top 3</CardTitle>
            </CardHeader>
            <CardContent>
              {topDates.length === 0 ? (
                <p className="text-sm text-gray-400">아직 투표 데이터가 없습니다.</p>
              ) : (
                <ol className="space-y-4">
                  {topDates.map((d, i) => {
                    const dateVotes = votes.filter(v => v.vote_date === d.date)
                    const voters = dateVotes.map(v => memberMap.get(v.member_id) ?? '?')

                    // 시간대별 투표자 목록 (인원 많은 순 정렬, 상위 4개)
                    const hourVoters = Object.entries(d.timeSlotCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([hour]) => ({
                        hour,
                        names: dateVotes
                          .filter(v => (v.time_slots as string[]).includes(hour))
                          .map(v => memberMap.get(v.member_id) ?? '?'),
                      }))

                    return (
                      <li key={d.date} className="space-y-1.5 pb-3 last:pb-0 border-b last:border-b-0">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-800">{formatShort(d.date)}</span>
                          <span className="ml-auto text-xs text-gray-400">{d.availableCount}명 가능</span>
                        </div>

                        {/* 날짜 투표자 */}
                        <div className="ml-9 flex flex-wrap gap-1">
                          {voters.map(name => (
                            <span key={name} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {name}
                            </span>
                          ))}
                        </div>

                        {/* 시간대별 투표자 */}
                        {hourVoters.length > 0 && (
                          <div className="ml-9 space-y-1">
                            {hourVoters.map(({ hour, names }) => (
                              <div key={hour} className="flex items-baseline gap-2 text-xs">
                                <span className="text-blue-600 font-medium w-10 shrink-0">
                                  {formatHour(hour)}
                                </span>
                                <span className="text-gray-500">{names.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        )}

        {/* 추천 모임 장소 */}
        {membersWithOrigin.length >= 2 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">추천 모임 장소</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                출발지 입력 완료 {membersWithOrigin.length}명 기준 중간 지점 근처 상권
              </p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {recommendedRegions.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      중간 지점에서 {r.distanceKm.toFixed(1)}km
                    </span>
                  </li>
                ))}
              </ol>
              {membersWithOrigin.length < memberCount && (
                <p className="text-xs text-gray-400 mt-3 pt-3 border-t">
                  출발지 미입력: {memberList
                    .filter(m => m.origin_lat == null)
                    .map(m => m.nickname)
                    .join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 출발지 입력 안내 (입력자 2명 미만) */}
        {membersWithOrigin.length < 2 && memberCount > 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-5 text-center space-y-1">
              <p className="text-sm text-gray-500">
                멤버들이 출발지를 입력하면 최적 모임 장소를 추천해드려요
              </p>
              <p className="text-xs text-gray-400">
                현재 {membersWithOrigin.length}명 입력 완료 — 2명 이상 필요
              </p>
            </CardContent>
          </Card>
        )}

        {/* 확정 플로우 */}
        {group.status === 'voting' && hasAnyVotes && topDates.length > 0 && (
          <ConfirmFlow
            token={token}
            topDates={topDates}
            recommendedRegions={recommendedRegions}
          />
        )}

        {/* 확정 결과 링크 */}
        {group.status === 'confirmed' && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">약속이 확정됐어요!</p>
                <p className="text-xs text-green-600 mt-0.5">{group.confirmed_date ? formatDate(group.confirmed_date) : ''} · {group.confirmed_region ?? ''}</p>
              </div>
              <a
                href={`/group/${token}/result`}
                className={cn(buttonVariants({ size: 'sm' }), 'bg-green-600 hover:bg-green-700')}
              >
                결과 보기
              </a>
            </CardContent>
          </Card>
        )}

        {/* 투표 현황 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">날짜별 투표 현황</CardTitle>
              <Link
                href={`/group/${token}/vote`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                내 날짜 입력
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!hasAnyVotes ? (
              <p className="text-sm text-gray-400">아직 투표한 멤버가 없습니다.</p>
            ) : (
              <ul className="space-y-1.5">
                {dates.map(date => {
                  const count = voteMap.get(date) ?? 0
                  if (count === 0) return null
                  const pct = memberCount > 0 ? (count / memberCount) * 100 : 0
                  return (
                    <li key={date} className="space-y-0.5">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{formatShort(date)}</span>
                        <span className="text-blue-600">{count}명 가능</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 참여 멤버 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">참여 멤버 ({memberCount}명)</CardTitle>
          </CardHeader>
          <CardContent>
            {memberCount === 0 ? (
              <p className="text-sm text-gray-400">아직 참여한 멤버가 없습니다. 링크를 공유하세요!</p>
            ) : (
              <ul className="space-y-2">
                {memberList.map((m) => {
                  const voted = votes.some(v => v.member_id === m.id)
                  return (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs">
                        {m.nickname[0]}
                      </span>
                      <span className="text-gray-800">{m.nickname}</span>
                      {m.nickname === group.creator_nickname && (
                        <Badge variant="outline" className="text-xs">주최자</Badge>
                      )}
                      <span className="ml-auto flex items-center gap-1.5">
                        {voted
                          ? <span className="text-xs text-blue-500">투표완료</span>
                          : <span className="text-xs text-gray-300">미투표</span>
                        }
                        {m.origin_lat != null
                          ? <span className="text-xs text-emerald-500">📍</span>
                          : <span className="text-xs text-gray-200">📍</span>
                        }
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
