export interface KakaoPlace {
  id: string
  name: string
  category: string
  address: string
  url: string
}

export async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  size = 5,
): Promise<KakaoPlace[]> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) return []

  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json')
  url.searchParams.set('query', query)
  url.searchParams.set('x', String(lng))
  url.searchParams.set('y', String(lat))
  url.searchParams.set('radius', '2000')
  url.searchParams.set('size', String(size))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${key}` },
    next: { revalidate: 3600 },
  })

  if (!res.ok) return []

  const json = (await res.json()) as {
    documents: Array<{
      id: string
      place_name: string
      category_name: string
      road_address_name: string
      address_name: string
      place_url: string
    }>
  }

  return json.documents.map((p) => ({
    id: p.id,
    name: p.place_name,
    category: p.category_name,
    address: p.road_address_name || p.address_name,
    url: p.place_url,
  }))
}
