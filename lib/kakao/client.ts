const REST_KEY = process.env.KAKAO_REST_API_KEY;

interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

/** 주소 문자열을 Kakao Local API로 좌표 변환. 결과 없으면 null. */
export async function geocodeAddress(
  query: string,
): Promise<GeocodeResult | null> {
  if (!REST_KEY) return null;

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
    {
      headers: { Authorization: `KakaoAK ${REST_KEY}` },
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    console.error('[kakao geocode] API error:', res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    documents: { address_name: string; x: string; y: string }[];
  };

  const doc = data.documents?.[0];
  if (!doc) return null;

  return {
    address: doc.address_name,
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
  };
}
