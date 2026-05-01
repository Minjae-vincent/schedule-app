export type WeatherCategory = 'sunny_warm' | 'sunny_cool' | 'cloudy' | 'rainy' | 'snowy' | 'hot'

export interface ActivitySuggestion {
  category: WeatherCategory
  label: string
  description: string
  keywords: string[]
}

export function categorizeWeather(main: string, temp: number): WeatherCategory {
  if (main === 'Snow') return 'snowy'
  if (main === 'Rain' || main === 'Drizzle' || main === 'Thunderstorm') return 'rainy'
  if (temp >= 28) return 'hot'
  if (main === 'Clear' && temp >= 15) return 'sunny_warm'
  if (main === 'Clear') return 'sunny_cool'
  return 'cloudy'
}

const SUGGESTIONS: Record<WeatherCategory, ActivitySuggestion> = {
  sunny_warm: {
    category: 'sunny_warm',
    label: '야외 활동',
    description: '맑고 따뜻한 날씨! 야외에서 즐기기 좋아요',
    keywords: ['공원', '루프탑카페', '피크닉'],
  },
  sunny_cool: {
    category: 'sunny_cool',
    label: '가볍게 산책',
    description: '선선하고 맑은 날씨, 걷기 딱 좋아요',
    keywords: ['카페', '갤러리', '공원'],
  },
  cloudy: {
    category: 'cloudy',
    label: '실내·실외 모두',
    description: '흐린 날씨, 실내도 실외도 괜찮아요',
    keywords: ['카페', '전시회', '레스토랑'],
  },
  rainy: {
    category: 'rainy',
    label: '실내 활동',
    description: '비 오는 날엔 따뜻한 실내로',
    keywords: ['카페', '영화관', '보드게임카페'],
  },
  snowy: {
    category: 'snowy',
    label: '실내 활동',
    description: '눈 오는 날엔 따뜻한 실내에서',
    keywords: ['카페', '전시회', '보드게임카페'],
  },
  hot: {
    category: 'hot',
    label: '시원한 실내',
    description: '더운 날씨, 에어컨 있는 곳이 최고!',
    keywords: ['카페', '영화관', '쇼핑몰'],
  },
}

export function getSuggestion(main: string, temp: number): ActivitySuggestion {
  return SUGGESTIONS[categorizeWeather(main, temp)]
}
