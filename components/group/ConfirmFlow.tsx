'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VoteCount } from '@/lib/date/optimal'
import type { Region } from '@/lib/kakao/regions'

interface RegionWithDist extends Region {
  distanceKm: number
}

interface Props {
  token: string
  topDates: VoteCount[]
  recommendedRegions: RegionWithDist[]
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function formatShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_LABELS[d.getDay()]})`
}

export function ConfirmFlow({ token, topDates, recommendedRegions }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<VoteCount | null>(topDates[0] ?? null)
  const [selectedRegion, setSelectedRegion] = useState<RegionWithDist | null>(recommendedRegions[0] ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!selectedDate || !selectedRegion) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_token: token,
          confirmed_date: selectedDate.date,
          confirmed_region: selectedRegion.name,
          confirmed_lat: selectedRegion.lat,
          confirmed_lng: selectedRegion.lng,
        }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        setError(json.error ?? '확정에 실패했습니다.')
        return
      }

      router.push(`/group/${token}/result`)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-blue-800">약속 확정하기</CardTitle>
        <p className="text-xs text-blue-600">날짜와 장소를 선택해 확정하세요</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 날짜 선택 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">날짜</p>
          <div className="flex flex-wrap gap-2">
            {topDates.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedDate?.date === d.date
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {formatShort(d.date)} · {d.availableCount}명
              </button>
            ))}
          </div>
        </div>

        {/* 장소 선택 */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-600">장소</p>
          <div className="flex flex-wrap gap-2">
            {recommendedRegions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRegion(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedRegion?.id === r.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleConfirm}
          disabled={loading || !selectedDate || !selectedRegion}
        >
          {loading ? '확정 중...' : '확정하기'}
        </Button>
      </CardContent>
    </Card>
  )
}
