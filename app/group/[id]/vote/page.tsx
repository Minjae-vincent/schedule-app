import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { VoteForm } from '@/components/vote/VoteForm'
import { supabaseAdmin } from '@/lib/supabase/server'

export default async function VotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: token } = await params

  const { data: group } = await supabaseAdmin
    .from('groups')
    .select('id, name, creator_nickname, date_range_start, date_range_end, vote_mode')
    .eq('invite_token', token)
    .single()

  if (!group) notFound()

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500 mt-1">가능한 날짜를 입력하세요</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <VoteForm
              token={token}
              dateRangeStart={group.date_range_start}
              dateRangeEnd={group.date_range_end}
              voteMode={group.vote_mode as 'date_only' | 'date_time'}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
