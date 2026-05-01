export type GroupStatus = 'voting' | 'confirmed'
export type VoteMode = 'date_only' | 'date_time'

// 시간 슬롯: 두 자리 시각 문자열, e.g. '09', '10', ..., '22'
export type TimeSlot = string

// 9시 ~ 22시, 1시간 단위 14개 슬롯
export const VALID_HOURS: readonly TimeSlot[] = Array.from(
  { length: 14 },
  (_, i) => String(i + 9).padStart(2, '0'),
)

export interface Group {
  id: string
  invite_token: string
  name: string
  creator_nickname: string
  date_range_start: string
  date_range_end: string
  vote_mode: VoteMode
  status: GroupStatus
  confirmed_date: string | null
  confirmed_region: string | null
  confirmed_lat: number | null
  confirmed_lng: number | null
  created_at: string
}

export interface Member {
  id: string
  group_id: string
  nickname: string
  origin_address: string | null
  origin_lat: number | null
  origin_lng: number | null
  created_at: string
}

export interface DateVote {
  id: string
  group_id: string
  member_id: string
  vote_date: string
  time_slots: TimeSlot[]
}
