'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { VoteMode } from '@/types/domain'

export function NewGroupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voteMode, setVoteMode] = useState<VoteMode>('date_only')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      creator_nickname: (form.elements.namedItem('creator_nickname') as HTMLInputElement).value.trim(),
      date_range_start: (form.elements.namedItem('date_range_start') as HTMLInputElement).value,
      date_range_end: (form.elements.namedItem('date_range_end') as HTMLInputElement).value,
      vote_mode: voteMode,
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json() as { ok: boolean; data?: { invite_token: string }; error?: string }

      if (!json.ok || !json.data) {
        setError(json.error ?? '그룹 생성에 실패했습니다.')
        return
      }

      router.push(`/group/${json.data.invite_token}/join?as=${encodeURIComponent(data.creator_nickname)}`)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">약속 이름</Label>
            <Input
              id="name"
              name="name"
              placeholder="예: 5월 친구 모임"
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creator_nickname">내 닉네임</Label>
            <Input
              id="creator_nickname"
              name="creator_nickname"
              placeholder="예: 민준"
              required
              maxLength={20}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date_range_start">시작일</Label>
              <Input
                id="date_range_start"
                name="date_range_start"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_range_end">종료일</Label>
              <Input
                id="date_range_end"
                name="date_range_end"
                type="date"
                required
              />
            </div>
          </div>

          {/* 투표 모드 선택 */}
          <div className="space-y-2">
            <Label>참여자가 입력할 정보</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'date_only', title: '날짜만', desc: '가능한 날짜를 선택' },
                { value: 'date_time', title: '날짜 + 시간대', desc: '날짜와 가능한 시간 선택' },
              ] as { value: VoteMode; title: string; desc: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVoteMode(opt.value)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-xl border text-left transition-colors',
                    voteMode === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                  )}
                >
                  <span className="text-sm font-semibold">{opt.title}</span>
                  <span className={cn('text-xs mt-0.5', voteMode === opt.value ? 'text-blue-500' : 'text-gray-400')}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '생성 중...' : '약속 만들기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
