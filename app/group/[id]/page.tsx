import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyLinkButton } from '@/components/group/CopyLinkButton'
import { Group, Member } from '@/types/domain'

interface GroupWithMembers extends Group {
  members: Pick<Member, 'id' | 'nickname' | 'created_at'>[]
}

async function getGroup(token: string): Promise<GroupWithMembers | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/groups/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json() as { ok: boolean; data?: GroupWithMembers }
  return json.ok && json.data ? json.data : null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default async function GroupDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: token } = await params
  const group = await getGroup(token)

  if (!group) notFound()

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-10">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <Badge variant={group.status === 'confirmed' ? 'default' : 'secondary'}>
              {group.status === 'confirmed' ? '확정' : '투표 중'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            주최자: {group.creator_nickname} · {formatDate(group.date_range_start)} ~ {formatDate(group.date_range_end)}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">초대 링크</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500 break-all font-mono bg-gray-50 rounded p-2">
              /group/{token}/join
            </p>
            <CopyLinkButton token={token} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">참여 멤버 ({group.members.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            {group.members.length === 0 ? (
              <p className="text-sm text-gray-400">아직 참여한 멤버가 없습니다. 링크를 공유하세요!</p>
            ) : (
              <ul className="space-y-2">
                {group.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs">
                      {m.nickname[0]}
                    </span>
                    <span className="text-gray-800">{m.nickname}</span>
                    {m.nickname === group.creator_nickname && (
                      <Badge variant="outline" className="text-xs">주최자</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
