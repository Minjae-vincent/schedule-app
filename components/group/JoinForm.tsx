'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  token: string
  groupId: string
}

export function JoinForm({ token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const nickname = (e.currentTarget.elements.namedItem('nickname') as HTMLInputElement).value.trim()

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_token: token, nickname }),
      })
      const json = await res.json() as { ok: boolean; error?: string }

      if (!json.ok) {
        setError(json.error ?? '참여에 실패했습니다.')
        return
      }

      router.push(`/group/${token}`)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        {loading ? '참여 중...' : '참여하기'}
      </Button>
    </form>
  )
}
