'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateVotePicker } from '@/components/vote/DateVotePicker'
import { OriginInput, type OriginData } from '@/components/group/OriginInput'
import type { VoteEntry } from '@/lib/date/votes'
import type { VoteMode } from '@/types/domain'

interface Props {
  token: string
  dateRangeStart: string
  dateRangeEnd: string
  voteMode: VoteMode
  presetNickname?: string
}

type Step = 'nickname' | 'vote' | 'origin'

export function JoinFlow({ token, dateRangeStart, dateRangeEnd, voteMode, presetNickname }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(presetNickname ? 'vote' : 'nickname')
  const [nickname, setNickname] = useState(presetNickname ?? '')
  const [votes, setVotes] = useState<VoteEntry[]>([])
  const [origin, setOrigin] = useState<OriginData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNicknameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const value = (e.currentTarget.elements.namedItem('nickname') as HTMLInputElement).value.trim()

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_token: token, nickname: value }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        setError(json.error ?? '참여에 실패했습니다.')
        return
      }

      setNickname(value)
      setStep('vote')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVoteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_token: token, nickname, votes }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        setError(json.error ?? '투표 저장에 실패했습니다.')
        return
      }

      setStep('origin')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOriginSubmit(skip = false) {
    setError(null)

    if (!skip && origin) {
      setLoading(true)
      try {
        const res = await fetch('/api/members', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invite_token: token,
            nickname,
            origin_address: origin.address,
            origin_lat: origin.lat,
            origin_lng: origin.lng,
          }),
        })
        const json = await res.json() as { ok: boolean; error?: string }
        if (!json.ok) {
          setError(json.error ?? '출발지 저장에 실패했습니다.')
          return
        }
      } catch {
        setError('네트워크 오류가 발생했습니다.')
        return
      } finally {
        setLoading(false)
      }
    }

    router.push(`/group/${token}`)
    router.refresh()
  }

  // ── Step 1: 닉네임 ───────────────────────────────────────────────
  if (step === 'nickname') {
    return (
      <form onSubmit={handleNicknameSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            name="nickname"
            placeholder="예: 지수"
            required
            maxLength={20}
            autoFocus
          />
          <p className="text-xs text-gray-400">이 약속에서 사용할 이름을 입력하세요</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '확인 중...' : '다음'}
        </Button>
      </form>
    )
  }

  // ── Step 2: 날짜 투표 ─────────────────────────────────────────────
  if (step === 'vote') {
    return (
      <form onSubmit={handleVoteSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>가능한 날짜를 선택하세요</Label>
          <p className="text-xs text-gray-400">탭해서 가능/불가능을 선택해요</p>
          <DateVotePicker
            dateRangeStart={dateRangeStart}
            dateRangeEnd={dateRangeEnd}
            voteMode={voteMode}
            onChange={setVotes}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => { setStep('nickname'); setError(null) }}
            disabled={loading}
          >
            이전
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? '저장 중...' : '다음'}
          </Button>
        </div>
      </form>
    )
  }

  // ── Step 3: 출발지 ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>출발지를 알려주세요</Label>
        <p className="text-xs text-gray-400">집이나 자주 있는 곳을 입력하면 모임 장소 추천에 활용돼요</p>
        <OriginInput onChange={setOrigin} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => { setStep('vote'); setError(null) }}
          disabled={loading}
        >
          이전
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => handleOriginSubmit(true)}
          disabled={loading}
        >
          건너뛰기
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => handleOriginSubmit(false)}
          disabled={loading || !origin}
        >
          {loading ? '저장 중...' : '완료'}
        </Button>
      </div>
    </div>
  )
}
