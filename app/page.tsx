import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">모임조율</h1>
          <p className="text-lg text-gray-500">
            링크 하나 공유하고, 각자 입력하면<br />
            날짜 · 장소 · 활동을 자동으로 추천해드립니다
          </p>
        </div>

        <Link href="/group/new" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
          약속 만들기
        </Link>

        <div className="text-xs text-gray-400 space-y-1">
          <p>로그인 없이 닉네임만으로 참여</p>
          <p>3~8명 소모임 최적화</p>
        </div>
      </div>
    </main>
  )
}
