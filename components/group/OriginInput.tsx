'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export interface OriginData {
  address: string
  lat: number
  lng: number
}

interface Props {
  onChange: (data: OriginData | null) => void
}

// Kakao 우편번호 서비스 전역 타입
declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: { roadAddress: string; address: string; x: string; y: string }) => void
      }) => { open: () => void }
    }
  }
}

const POSTCODE_SCRIPT_SRC = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

function loadPostcodeScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.daum?.Postcode) { resolve(); return }
    const script = document.createElement('script')
    script.src = POSTCODE_SCRIPT_SRC
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export function OriginInput({ onChange }: Props) {
  const [selected, setSelected] = useState<OriginData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPostcodeScript().catch(() => null)
  }, [])

  async function openSearch() {
    setError(null)
    await loadPostcodeScript()

    if (!window.daum?.Postcode) {
      setError('주소 검색을 불러올 수 없습니다.')
      return
    }

    new window.daum.Postcode({
      oncomplete: async (data) => {
        const address = data.roadAddress || data.address

        // 위젯이 좌표를 직접 제공하는 경우
        const lat = parseFloat(data.y)
        const lng = parseFloat(data.x)

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          const result = { address, lat, lng }
          setSelected(result)
          onChange(result)
          return
        }

        // 좌표 없으면 서버사이드 지오코딩 시도
        setLoading(true)
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`)
          const json = await res.json() as { ok: boolean; data?: OriginData; error?: string }

          if (!json.ok || !json.data) {
            setError('좌표를 찾을 수 없습니다. 다른 주소로 시도해보세요.')
            return
          }

          const result = { address: json.data.address, lat: json.data.lat, lng: json.data.lng }
          setSelected(result)
          onChange(result)
        } catch {
          setError('네트워크 오류가 발생했습니다.')
        } finally {
          setLoading(false)
        }
      },
    }).open()
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 cursor-pointer hover:border-blue-300 transition-colors"
        onClick={openSearch}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && openSearch()}
      >
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {selected ? (
          <span className="text-sm text-gray-800 truncate">{selected.address}</span>
        ) : (
          <span className="text-sm text-gray-400">{loading ? '검색 중...' : '주소 검색 (클릭)'}</span>
        )}
        {selected && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto shrink-0 text-xs h-7 px-2"
            onClick={e => { e.stopPropagation(); setSelected(null); onChange(null) }}
          >
            변경
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
