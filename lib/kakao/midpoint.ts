import { MAJOR_REGIONS, type Region } from './regions'

export interface Coord {
  lat: number
  lng: number
}

export interface RegionWithDistance extends Region {
  distanceKm: number
}

/** 위경도 배열의 산술 평균 좌표를 반환. 빈 배열이면 null. */
export function calcMidpoint(coords: Coord[]): Coord | null {
  if (coords.length === 0) return null
  return {
    lat: coords.reduce((s, c) => s + c.lat, 0) / coords.length,
    lng: coords.reduce((s, c) => s + c.lng, 0) / coords.length,
  }
}

/** Haversine 공식으로 두 좌표 간 거리(km)를 계산. */
export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const chord =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}

/**
 * 중간 지점에서 가장 가까운 주요 상권 n개를 거리 오름차순으로 반환.
 * 중간 지점이 null이면 빈 배열.
 */
export function getNearestRegions(midpoint: Coord | null, n = 3): RegionWithDistance[] {
  if (!midpoint) return []
  return MAJOR_REGIONS.map(r => ({ ...r, distanceKm: haversineKm(midpoint, r) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, n)
}
