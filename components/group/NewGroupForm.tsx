'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export function NewGroupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      router.push(`/group/${json.data.invite_token}`)
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

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '생성 중...' : '약속 만들기'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
