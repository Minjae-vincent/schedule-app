'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateVotePicker, type VoteEntry } from '@/components/vote/DateVotePicker'
import type { VoteMode } from '@/types/domain'

interface Props {
  token: string
  dateRangeStart: string
  dateRangeEnd: string
  voteMode: VoteMode
}

type Step = 'nickname' | 'vote'

export function VoteForm({ token, dateRangeStart, dateRangeEnd, voteMode }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('nickname')
  const [nickname, setNickname] = useState('')
  const [existingVotes, setExistingVotes] = useState<VoteEntry[]>([])
  const [votes, setVotes] = useState<VoteEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNicknameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const value = (e.currentTarget.elements.namedItem('nickname') as HTMLInputElement).value.trim()

    try {
      const res = await fetch(`/api/votes?token=${encodeURIComponent(token)}&nickname=${encodeURIComponent(value)}`)
      const json = await res.json() as { ok: boolean; data?: VoteEntry[]; error?: string }

      if (!json.ok) {
        setError(json.error ?? '조회에 실패했습니다.')
        return
      }

      setNickname(value)
      setExistingVotes(json.data ?? [])
      setVotes(json.data ?? [])
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

      router.push(`/group/${token}`)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'nickname') {
    return (
      <form onSubmit={handleNicknameSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            name="nickname"
            placeholder="참여 시 사용한 닉네임"
            required
            maxLength={20}
            autoFocus
          />
          <p className="text-xs text-gray-400">참여할 때 입력한 닉네임을 입력하세요</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '확인 중...' : '다음'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleVoteSubmit} className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">{nickname}님의 가능한 날짜</p>
        {existingVotes.length > 0 && (
          <p className="text-xs text-blue-600">기존 투표를 불러왔습니다. 변경 후 저장하세요.</p>
        )}
      </div>
      <DateVotePicker
        dateRangeStart={dateRangeStart}
        dateRangeEnd={dateRangeEnd}
        voteMode={voteMode}
        initialVotes={existingVotes}
        onChange={setVotes}
      />

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
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  )
}
