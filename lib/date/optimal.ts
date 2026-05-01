import type { TimeSlot } from '@/types/domain'

export interface VoteCount {
  date: string
  availableCount: number
  timeSlotCounts: Record<string, number>
}

export function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function getTopDates(
  votes: { vote_date: string; time_slots?: string[] }[],
  n = 3
): VoteCount[] {
  const map = new Map<string, VoteCount>()

  for (const vote of votes) {
    if (!map.has(vote.vote_date)) {
      map.set(vote.vote_date, { date: vote.vote_date, availableCount: 0, timeSlotCounts: {} })
    }
    const entry = map.get(vote.vote_date)!
    entry.availableCount++

    for (const slot of (vote.time_slots ?? [])) {
      const key = slot as TimeSlot
      entry.timeSlotCounts[key] = (entry.timeSlotCounts[key] ?? 0) + 1
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.availableCount - a.availableCount)
    .slice(0, n)
}
