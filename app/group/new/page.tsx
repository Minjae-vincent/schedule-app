import { NewGroupForm } from '@/components/group/NewGroupForm'

export default function NewGroupPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">약속 만들기</h1>
          <p className="text-sm text-gray-500 mt-1">정보를 입력하면 초대 링크가 생성됩니다</p>
        </div>
        <NewGroupForm />
      </div>
    </main>
  )
}
