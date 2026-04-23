export type GroupStatus = 'voting' | 'confirmed'

export interface Group {
  id: string
  invite_token: string
  name: string
  creator_nickname: string
  date_range_start: string
  date_range_end: string
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
  preference: 'available' | 'if_needed'
}
