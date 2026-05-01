'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({ token, path = 'join' }: { token: string; path?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/group/${token}/${path}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleCopy}>
      {copied ? '복사됨!' : path === 'result' ? '결과 링크 복사' : '초대 링크 복사'}
    </Button>
  )
}
