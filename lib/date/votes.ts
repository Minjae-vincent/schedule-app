import type { TimeSlot } from '@/types/domain'

export interface VoteEntry {
  vote_date: string
  time_slots: TimeSlot[]
}

export interface VoteState {
  available: Set<string>
  slots: Record<string, Set<TimeSlot>>
}

/**
 * 날짜 범위 배열과 초기 투표 데이터를 받아 내부 상태를 초기화한다.
 * 범위에 없는 날짜의 initialVotes는 무시된다.
 */
export function initVoteState(dates: string[], initialVotes?: VoteEntry[]): VoteState {
  const available = new Set<string>()
  const slots: Record<string, Set<TimeSlot>> = {}
  for (const date of dates) slots[date] = new Set()

  if (initialVotes) {
    for (const v of initialVotes) {
      if (v.vote_date in slots) {
        available.add(v.vote_date)
        for (const s of v.time_slots) slots[v.vote_date].add(s)
      }
    }
  }
  return { available, slots }
}

/**
 * 내부 상태(available + slots)를 API 전송용 VoteEntry 배열로 변환한다.
 * time_slots는 알파벳 순(= 시각 오름차순) 정렬된다.
 */
export function buildVoteEntries(available: Set<string>, slots: Record<string, Set<TimeSlot>>): VoteEntry[] {
  const entries: VoteEntry[] = []
  for (const date of available) {
    entries.push({ vote_date: date, time_slots: Array.from(slots[date]).sort() })
  }
  return entries
}
