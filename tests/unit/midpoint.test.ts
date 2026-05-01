import { describe, it, expect } from 'vitest'
import { calcMidpoint, haversineKm, getNearestRegions } from '@/lib/kakao/midpoint'
import { MAJOR_REGIONS } from '@/lib/kakao/regions'

// ─── calcMidpoint ─────────────────────────────────────────────────────────

describe('calcMidpoint', () => {
  it('빈 배열: null 반환', () => {
    expect(calcMidpoint([])).toBeNull()
  })

  it('1명: 그대로 반환', () => {
    const result = calcMidpoint([{ lat: 37.5, lng: 127.0 }])
    expect(result?.lat).toBeCloseTo(37.5)
    expect(result?.lng).toBeCloseTo(127.0)
  })

  it('2명: 정확히 중간값', () => {
    const result = calcMidpoint([
      { lat: 37.4, lng: 126.9 },
      { lat: 37.6, lng: 127.1 },
    ])
    expect(result?.lat).toBeCloseTo(37.5)
    expect(result?.lng).toBeCloseTo(127.0)
  })

  it('3명 이상: 산술 평균', () => {
    const result = calcMidpoint([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 127.0 },
      { lat: 38.0, lng: 127.0 },
    ])
    expect(result?.lat).toBeCloseTo(37.6667, 3)
    expect(result?.lng).toBeCloseTo(127.0)
  })

  it('동일 좌표 여러 명: 그대로 반환', () => {
    const coord = { lat: 37.5, lng: 127.0 }
    const result = calcMidpoint([coord, coord, coord])
    expect(result?.lat).toBeCloseTo(37.5)
    expect(result?.lng).toBeCloseTo(127.0)
  })

  it('결과에 lat, lng 두 필드 모두 존재', () => {
    const result = calcMidpoint([{ lat: 37.5, lng: 127.0 }])
    expect(result).toHaveProperty('lat')
    expect(result).toHaveProperty('lng')
  })
})

// ─── haversineKm ─────────────────────────────────────────────────────────

describe('haversineKm', () => {
  it('동일 좌표: 거리 0', () => {
    const p = { lat: 37.5, lng: 127.0 }
    expect(haversineKm(p, p)).toBeCloseTo(0)
  })

  it('강남 ↔ 홍대: 약 10~12km', () => {
    const gangnam = { lat: 37.4979, lng: 127.0276 }
    const hongdae = { lat: 37.5563, lng: 126.9235 }
    const d = haversineKm(gangnam, hongdae)
    expect(d).toBeGreaterThan(9)
    expect(d).toBeLessThan(13)
  })

  it('대칭성: d(A→B) === d(B→A)', () => {
    const a = { lat: 37.4979, lng: 127.0276 }
    const b = { lat: 37.5563, lng: 126.9235 }
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 5)
  })

  it('위도 1도 차이: 약 111km', () => {
    const a = { lat: 37.0, lng: 127.0 }
    const b = { lat: 38.0, lng: 127.0 }
    const d = haversineKm(a, b)
    expect(d).toBeGreaterThan(108)
    expect(d).toBeLessThan(114)
  })

  it('결과가 0 이상의 수', () => {
    const a = { lat: 37.5, lng: 126.9 }
    const b = { lat: 37.6, lng: 127.1 }
    expect(haversineKm(a, b)).toBeGreaterThan(0)
  })
})

// ─── getNearestRegions ────────────────────────────────────────────────────

describe('getNearestRegions', () => {
  it('midpoint null: 빈 배열', () => {
    expect(getNearestRegions(null)).toEqual([])
  })

  it('기본 n=3: 3개 반환', () => {
    expect(getNearestRegions({ lat: 37.5, lng: 127.0 })).toHaveLength(3)
  })

  it('n=1: 1개 반환', () => {
    expect(getNearestRegions({ lat: 37.5, lng: 127.0 }, 1)).toHaveLength(1)
  })

  it('n > 지역 수: 있는 만큼만 반환', () => {
    const result = getNearestRegions({ lat: 37.5, lng: 127.0 }, 999)
    expect(result.length).toBe(MAJOR_REGIONS.length)
  })

  it('거리 오름차순 정렬', () => {
    const result = getNearestRegions({ lat: 37.5, lng: 127.0 }, 5)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distanceKm).toBeGreaterThanOrEqual(result[i - 1].distanceKm)
    }
  })

  it('distanceKm 필드 존재하고 0 이상', () => {
    const result = getNearestRegions({ lat: 37.5, lng: 127.0 })
    for (const r of result) {
      expect(r.distanceKm).toBeGreaterThanOrEqual(0)
    }
  })

  it('강남 근처 좌표: 강남이 1위', () => {
    const nearGangnam = { lat: 37.498, lng: 127.028 }
    const result = getNearestRegions(nearGangnam, 1)
    expect(result[0].id).toBe('gangnam')
  })

  it('홍대 근처 좌표: 홍대가 1위', () => {
    const nearHongdae = { lat: 37.556, lng: 126.924 }
    const result = getNearestRegions(nearHongdae, 1)
    expect(result[0].id).toBe('hongdae')
  })

  it('각 결과에 id, name, lat, lng, distanceKm 포함', () => {
    const result = getNearestRegions({ lat: 37.5, lng: 127.0 }, 1)
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('name')
    expect(result[0]).toHaveProperty('lat')
    expect(result[0]).toHaveProperty('lng')
    expect(result[0]).toHaveProperty('distanceKm')
  })

  it('결과 지역들이 MAJOR_REGIONS의 부분집합', () => {
    const ids = new Set(MAJOR_REGIONS.map(r => r.id))
    const result = getNearestRegions({ lat: 37.5, lng: 127.0 })
    for (const r of result) expect(ids.has(r.id)).toBe(true)
  })
})

// ─── MAJOR_REGIONS ────────────────────────────────────────────────────────

describe('MAJOR_REGIONS', () => {
  it('비어 있지 않음', () => {
    expect(MAJOR_REGIONS.length).toBeGreaterThan(0)
  })

  it('모든 좌표가 한국 범위 내 (lat 33~38, lng 124~130)', () => {
    for (const r of MAJOR_REGIONS) {
      expect(r.lat).toBeGreaterThan(33)
      expect(r.lat).toBeLessThan(38.5)
      expect(r.lng).toBeGreaterThan(124)
      expect(r.lng).toBeLessThan(130)
    }
  })

  it('id 중복 없음', () => {
    const ids = MAJOR_REGIONS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('name 중복 없음', () => {
    const names = MAJOR_REGIONS.map(r => r.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
