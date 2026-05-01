import { describe, it, expect } from 'vitest'
import { getTopDates, getDatesInRange } from '@/lib/date/optimal'

// ─── getDatesInRange ───────────────────────────────────────────────────────

describe('getDatesInRange', () => {
  it('일반 범위: 3일 반환', () => {
    expect(getDatesInRange('2025-05-01', '2025-05-03')).toEqual([
      '2025-05-01', '2025-05-02', '2025-05-03',
    ])
  })

  it('하루: start === end', () => {
    expect(getDatesInRange('2025-05-01', '2025-05-01')).toEqual(['2025-05-01'])
  })

  it('월 경계 넘기: 1월 30일 → 2월 2일', () => {
    expect(getDatesInRange('2025-01-30', '2025-02-02')).toEqual([
      '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02',
    ])
  })

  it('연도 경계 넘기: 12월 30일 → 1월 2일', () => {
    expect(getDatesInRange('2024-12-30', '2025-01-02')).toEqual([
      '2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02',
    ])
  })

  it('윤년: 2월 28일 → 3월 1일 (2024년)', () => {
    expect(getDatesInRange('2024-02-28', '2024-03-01')).toEqual([
      '2024-02-28', '2024-02-29', '2024-03-01',
    ])
  })

  it('평년: 2월 28일 → 3월 1일 (2025년)', () => {
    expect(getDatesInRange('2025-02-28', '2025-03-01')).toEqual([
      '2025-02-28', '2025-03-01',
    ])
  })

  it('긴 범위: 31일간 정확히 31개 반환', () => {
    const dates = getDatesInRange('2025-05-01', '2025-05-31')
    expect(dates).toHaveLength(31)
    expect(dates[0]).toBe('2025-05-01')
    expect(dates[30]).toBe('2025-05-31')
  })

  it('start > end: 빈 배열 반환', () => {
    expect(getDatesInRange('2025-05-10', '2025-05-01')).toEqual([])
  })

  it('반환값에 중복 없음', () => {
    const dates = getDatesInRange('2025-05-01', '2025-05-07')
    expect(new Set(dates).size).toBe(dates.length)
  })

  it('반환 날짜 형식이 YYYY-MM-DD', () => {
    const dates = getDatesInRange('2025-05-01', '2025-05-03')
    for (const d of dates) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

// ─── getTopDates ──────────────────────────────────────────────────────────

describe('getTopDates', () => {
  it('빈 투표: 빈 배열 반환', () => {
    expect(getTopDates([])).toEqual([])
  })

  it('1명 1날짜: availableCount=1', () => {
    const result = getTopDates([{ vote_date: '2025-05-01', time_slots: [] }])
    expect(result).toHaveLength(1)
    expect(result[0].availableCount).toBe(1)
    expect(result[0].date).toBe('2025-05-01')
  })

  it('N명이 같은 날짜에 투표: availableCount=N', () => {
    const votes = Array.from({ length: 5 }, () => ({
      vote_date: '2025-05-01', time_slots: [],
    }))
    const result = getTopDates(votes)
    expect(result[0].availableCount).toBe(5)
  })

  it('가능 인원 많은 날짜가 1위', () => {
    const votes = [
      { vote_date: '2025-05-01', time_slots: [] },
      { vote_date: '2025-05-02', time_slots: [] },
      { vote_date: '2025-05-02', time_slots: [] },
      { vote_date: '2025-05-03', time_slots: [] },
    ]
    const result = getTopDates(votes)
    expect(result[0].date).toBe('2025-05-02')
  })

  it('기본 n=3: 최대 3개 반환', () => {
    const votes = ['05-01', '05-02', '05-03', '05-04'].map(d => ({
      vote_date: `2025-${d}`, time_slots: ['09'],
    }))
    expect(getTopDates(votes)).toHaveLength(3)
  })

  it('n=1: 1개만 반환', () => {
    const votes = [
      { vote_date: '2025-05-01', time_slots: [] },
      { vote_date: '2025-05-02', time_slots: [] },
    ]
    expect(getTopDates(votes, 1)).toHaveLength(1)
    expect(getTopDates(votes, 1)[0].date).toBe('2025-05-01')
  })

  it('n이 고유 날짜 수보다 크면 있는 만큼만 반환', () => {
    const votes = [{ vote_date: '2025-05-01', time_slots: [] }]
    expect(getTopDates(votes, 10)).toHaveLength(1)
  })

  it('time_slots 필드 없어도 availableCount 집계', () => {
    const votes = [{ vote_date: '2025-05-01' }, { vote_date: '2025-05-01' }]
    const result = getTopDates(votes)
    expect(result[0].availableCount).toBe(2)
  })

  it('빈 time_slots 배열: timeSlotCounts 비어 있음', () => {
    const votes = [{ vote_date: '2025-05-01', time_slots: [] }]
    expect(getTopDates(votes)[0].timeSlotCounts).toEqual({})
  })

  it('같은 시간대를 여러 명이 선택: count 합산', () => {
    const votes = [
      { vote_date: '2025-05-01', time_slots: ['10'] },
      { vote_date: '2025-05-01', time_slots: ['10'] },
      { vote_date: '2025-05-01', time_slots: ['14'] },
    ]
    const result = getTopDates(votes)[0]
    expect(result.timeSlotCounts['10']).toBe(2)
    expect(result.timeSlotCounts['14']).toBe(1)
  })

  it('한 명이 여러 시간대 선택: 각각 집계', () => {
    const votes = [{ vote_date: '2025-05-01', time_slots: ['09', '10', '11'] }]
    const counts = getTopDates(votes)[0].timeSlotCounts
    expect(counts['09']).toBe(1)
    expect(counts['10']).toBe(1)
    expect(counts['11']).toBe(1)
  })

  it('여러 멤버 다른 시간대: 교집합 없이 집계', () => {
    const votes = [
      { vote_date: '2025-05-01', time_slots: ['09', '10'] },
      { vote_date: '2025-05-01', time_slots: ['14', '15'] },
    ]
    const counts = getTopDates(votes)[0].timeSlotCounts
    expect(counts['09']).toBe(1)
    expect(counts['10']).toBe(1)
    expect(counts['14']).toBe(1)
    expect(counts['15']).toBe(1)
  })

  it('동점 날짜: 두 날짜 모두 결과에 포함', () => {
    const votes = [
      { vote_date: '2025-05-01', time_slots: [] },
      { vote_date: '2025-05-02', time_slots: [] },
    ]
    const result = getTopDates(votes, 3)
    const dates = result.map(d => d.date)
    expect(dates).toContain('2025-05-01')
    expect(dates).toContain('2025-05-02')
  })

  it('날짜가 10개라도 n=3이면 3개', () => {
    const votes = Array.from({ length: 10 }, (_, i) => ({
      vote_date: `2025-05-${String(i + 1).padStart(2, '0')}`,
      time_slots: [],
    }))
    expect(getTopDates(votes, 3)).toHaveLength(3)
  })

  it('결과의 date 필드가 원본 vote_date와 동일', () => {
    const votes = [{ vote_date: '2025-05-15', time_slots: ['10'] }]
    expect(getTopDates(votes)[0].date).toBe('2025-05-15')
  })

  it('availableCount가 항상 0 이상', () => {
    const votes = [{ vote_date: '2025-05-01', time_slots: [] }]
    expect(getTopDates(votes)[0].availableCount).toBeGreaterThan(0)
  })
})
