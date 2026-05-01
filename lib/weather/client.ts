export interface WeatherData {
  date: string
  temp: number
  description: string
  icon: string
  main: string
}

export async function fetchWeatherForDate(
  lat: number,
  lng: number,
  date: string,
): Promise<WeatherData | null> {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return null

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${key}&units=metric&lang=kr`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return null

  const json = (await res.json()) as {
    list: Array<{
      dt_txt: string
      main: { temp: number }
      weather: Array<{ main: string; description: string; icon: string }>
    }>
  }

  const dayItems = json.list.filter((item) => item.dt_txt.startsWith(date))
  if (dayItems.length === 0) return null

  const noon = dayItems.find((item) => item.dt_txt.includes('12:00'))
  const item = noon ?? dayItems[0]

  return {
    date,
    temp: Math.round(item.main.temp),
    description: item.weather[0]?.description ?? '',
    icon: item.weather[0]?.icon ?? '',
    main: item.weather[0]?.main ?? '',
  }
}
