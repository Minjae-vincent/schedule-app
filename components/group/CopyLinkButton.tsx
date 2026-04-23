'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/group/${token}/join`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleCopy}>
      {copied ? '복사됨!' : '초대 링크 복사'}
    </Button>
  )
}
