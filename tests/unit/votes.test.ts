import { describe, it, expect } from 'vitest'
import { VALID_HOURS } from '@/types/domain'
import { initVoteState, buildVoteEntries } from '@/lib/date/votes'

// ─── VALID_HOURS ──────────────────────────────────────────────────────────

describe('VALID_HOURS', () => {
  it('정확히 14개 슬롯 (9~22시)', () => {
    expect(VALID_HOURS).toHaveLength(14)
  })

  it('첫 슬롯이 09', () => {
    expect(VALID_HOURS[0]).toBe('09')
  })

  it('마지막 슬롯이 22', () => {
    expect(VALID_HOURS[VALID_HOURS.length - 1]).toBe('22')
  })

  it('모두 두 자리 문자열 (zero-padded)', () => {
    for (const h of VALID_HOURS) {
      expect(h).toMatch(/^\d{2}$/)
    }
  })

  it('08은 포함되지 않음', () => {
    expect(VALID_HOURS).not.toContain('08')
  })

  it('23은 포함되지 않음', () => {
    expect(VALID_HOURS).not.toContain('23')
  })

  it('morning/afternoon/evening 같은 구 값 포함 안 됨', () => {
    expect(VALID_HOURS).not.toContain('morning')
    expect(VALID_HOURS).not.toContain('afternoon')
    expect(VALID_HOURS).not.toContain('evening')
  })

  it('9~22까지 빠진 시각 없음', () => {
    for (let h = 9; h <= 22; h++) {
      expect(VALID_HOURS).toContain(String(h).padStart(2, '0'))
    }
  })

  it('중복 없음', () => {
    expect(new Set(VALID_HOURS).size).toBe(VALID_HOURS.length)
  })
})

// ─── initVoteState ────────────────────────────────────────────────────────

describe('initVoteState', () => {
  const DATES = ['2025-05-01', '2025-05-02', '2025-05-03']

  it('initialVotes 없으면 모두 미선택', () => {
    const { available, slots } = initVoteState(DATES)
    expect(available.size).toBe(0)
    for (const d of DATES) expect(slots[d].size).toBe(0)
  })

  it('initialVotes 있으면 해당 날짜 available에 추가', () => {
    const { available } = initVoteState(DATES, [
      { vote_date: '2025-05-01', time_slots: [] },
    ])
    expect(available.has('2025-05-01')).toBe(true)
    expect(available.has('2025-05-02')).toBe(false)
  })

  it('time_slots 정상 복원', () => {
    const { slots } = initVoteState(DATES, [
      { vote_date: '2025-05-01', time_slots: ['09', '14'] },
    ])
    expect(slots['2025-05-01'].has('09')).toBe(true)
    expect(slots['2025-05-01'].has('14')).toBe(true)
    expect(slots['2025-05-01'].has('10')).toBe(false)
  })

  it('범위 밖 날짜는 무시', () => {
    const { available } = initVoteState(DATES, [
      { vote_date: '2025-06-15', time_slots: ['09'] },
    ])
    expect(available.has('2025-06-15')).toBe(false)
    expect('2025-06-15' in initVoteState(DATES).slots).toBe(false)
  })

  it('빈 time_slots: available에는 추가, slots는 비어 있음', () => {
    const { available, slots } = initVoteState(DATES, [
      { vote_date: '2025-05-02', time_slots: [] },
    ])
    expect(available.has('2025-05-02')).toBe(true)
    expect(slots['2025-05-02'].size).toBe(0)
  })

  it('여러 날짜 동시 초기화', () => {
    const { available } = initVoteState(DATES, [
      { vote_date: '2025-05-01', time_slots: ['09'] },
      { vote_date: '2025-05-03', time_slots: ['18'] },
    ])
    expect(available.has('2025-05-01')).toBe(true)
    expect(available.has('2025-05-03')).toBe(true)
    expect(available.has('2025-05-02')).toBe(false)
  })

  it('같은 날짜 중복 initialVotes: 슬롯 합집합', () => {
    const { slots } = initVoteState(DATES, [
      { vote_date: '2025-05-01', time_slots: ['09'] },
      { vote_date: '2025-05-01', time_slots: ['10'] },
    ])
    expect(slots['2025-05-01'].has('09')).toBe(true)
    expect(slots['2025-05-01'].has('10')).toBe(true)
  })

  it('dates 배열이 비면 available과 slots 모두 비어 있음', () => {
    const { available, slots } = initVoteState([], [
      { vote_date: '2025-05-01', time_slots: ['09'] },
    ])
    expect(available.size).toBe(0)
    expect(Object.keys(slots)).toHaveLength(0)
  })
})

// ─── buildVoteEntries ─────────────────────────────────────────────────────

describe('buildVoteEntries', () => {
  it('available 비어 있으면 빈 배열', () => {
    const result = buildVoteEntries(new Set(), {})
    expect(result).toEqual([])
  })

  it('가능 날짜 → vote_date 포함', () => {
    const available = new Set(['2025-05-01'])
    const slots = { '2025-05-01': new Set<string>() }
    const result = buildVoteEntries(available, slots)
    expect(result[0].vote_date).toBe('2025-05-01')
  })

  it('시간대 없으면 time_slots: []', () => {
    const available = new Set(['2025-05-01'])
    const slots = { '2025-05-01': new Set<string>() }
    expect(buildVoteEntries(available, slots)[0].time_slots).toEqual([])
  })

  it('시간대 있으면 정렬된 배열로 반환', () => {
    const available = new Set(['2025-05-01'])
    const slots = { '2025-05-01': new Set(['14', '09', '20']) }
    const result = buildVoteEntries(available, slots)
    expect(result[0].time_slots).toEqual(['09', '14', '20'])
  })

  it('여러 날짜: 모두 포함', () => {
    const available = new Set(['2025-05-01', '2025-05-03'])
    const slots = {
      '2025-05-01': new Set(['09']),
      '2025-05-03': new Set(['18']),
    }
    const result = buildVoteEntries(available, slots)
    expect(result).toHaveLength(2)
    const dates = result.map(r => r.vote_date)
    expect(dates).toContain('2025-05-01')
    expect(dates).toContain('2025-05-03')
  })

  it('available에 없는 날짜는 결과에 없음', () => {
    const available = new Set(['2025-05-01'])
    const slots = {
      '2025-05-01': new Set(['09']),
      '2025-05-02': new Set(['10']),
    }
    const result = buildVoteEntries(available, slots)
    expect(result.map(r => r.vote_date)).not.toContain('2025-05-02')
  })

  it('중복 시간대 없음 (Set 기반)', () => {
    const available = new Set(['2025-05-01'])
    const slots = { '2025-05-01': new Set(['09', '09', '10']) }
    const result = buildVoteEntries(available, slots)
    expect(result[0].time_slots).toHaveLength(2)
  })
})

// ─── initVoteState + buildVoteEntries 왕복 (round-trip) ──────────────────

describe('round-trip: initVoteState → buildVoteEntries', () => {
  it('초기 투표 → 내부 상태 → 다시 VoteEntry 로 복원', () => {
    const dates = ['2025-05-01', '2025-05-02', '2025-05-03']
    const original = [
      { vote_date: '2025-05-01', time_slots: ['09', '14'] },
      { vote_date: '2025-05-03', time_slots: [] },
    ]
    const { available, slots } = initVoteState(dates, original)
    const restored = buildVoteEntries(available, slots)

    // 순서 무관하게 비교
    const byDate = Object.fromEntries(restored.map(r => [r.vote_date, r.time_slots]))
    expect(byDate['2025-05-01']).toEqual(['09', '14'])
    expect(byDate['2025-05-03']).toEqual([])
    expect(byDate['2025-05-02']).toBeUndefined()
  })
})
