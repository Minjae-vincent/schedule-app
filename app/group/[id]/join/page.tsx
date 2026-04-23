import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { JoinForm } from '@/components/group/JoinForm'
import { Group } from '@/types/domain'

async function getGroup(token: string): Promise<Group | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/groups/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json() as { ok: boolean; data?: Group }
  return json.ok && json.data ? json.data : null
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: token } = await params
  const group = await getGroup(token)

  if (!group) notFound()

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div>
          <p className="text-sm text-blue-600 font-medium">초대받았습니다</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{group.name}</h1>
          <p className="text-sm text-gray-500 mt-1">주최자: {group.creator_nickname}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <JoinForm token={token} groupId={group.id} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
