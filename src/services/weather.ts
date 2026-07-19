import type { LatLng } from '../types/domain'

export interface DayForecast {
  precipitationChance: number // 0-100
  maxTempC: number
  summary: string
  emoji: string
  /** True when the forecast is wet enough that outdoor stops should be swapped. */
  suggestIndoor: boolean
}

/** Rough WMO weather-code buckets - enough for a chip, not a meteorology lesson. */
function describe(code: number): { summary: string; emoji: string } {
  if (code === 0) return { summary: 'Clear', emoji: '☀️' }
  if (code <= 2) return { summary: 'Partly cloudy', emoji: '⛅' }
  if (code === 3) return { summary: 'Overcast', emoji: '☁️' }
  if (code <= 48) return { summary: 'Foggy', emoji: '🌫️' }
  if (code <= 67) return { summary: 'Rainy', emoji: '🌧️' }
  if (code <= 77) return { summary: 'Snowy', emoji: '🌨️' }
  if (code <= 82) return { summary: 'Showers', emoji: '🌦️' }
  return { summary: 'Stormy', emoji: '⛈️' }
}

const INDOOR_THRESHOLD_PERCENT = 55

/**
 * Free, keyless forecast from Open-Meteo. Returns null when the date is out of
 * forecast range (~16 days) or the service is unreachable - callers treat null
 * as "no weather signal".
 */
export async function getDayForecast(location: LatLng, date: string): Promise<DayForecast | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lng),
      daily: 'precipitation_probability_max,temperature_2m_max,weather_code',
      timezone: 'auto',
      start_date: date,
      end_date: date,
    })
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
    if (!res.ok) return null

    const data: {
      daily?: {
        precipitation_probability_max?: (number | null)[]
        temperature_2m_max?: (number | null)[]
        weather_code?: (number | null)[]
      }
    } = await res.json()

    const precip = data.daily?.precipitation_probability_max?.[0]
    const temp = data.daily?.temperature_2m_max?.[0]
    const code = data.daily?.weather_code?.[0]
    if (precip == null || temp == null || code == null) return null

    const { summary, emoji } = describe(code)
    return {
      precipitationChance: precip,
      maxTempC: Math.round(temp),
      summary,
      emoji,
      suggestIndoor: precip >= INDOOR_THRESHOLD_PERCENT,
    }
  } catch {
    return null
  }
}
