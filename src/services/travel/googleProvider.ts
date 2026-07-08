import { GOOGLE_MAPS_API_KEY } from '../env'
import type { TravelProvider, TravelQuery, TravelResult } from './types'

const MODE_MAP: Record<string, string> = {
  walking: 'WALK',
  driving: 'DRIVE',
  transit: 'TRANSIT',
}

function parseDurationSeconds(duration: string | undefined): number {
  if (!duration) return 0
  return Number(duration.replace('s', ''))
}

/** Uses the Routes API (computeRoutes) for a single origin/destination pair. */
export const googleTravelProvider: TravelProvider = {
  name: 'google',

  async getTravelTime({ origin, destination, mode, departureTime }: TravelQuery): Promise<TravelResult> {
    if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY')

    const travelMode = MODE_MAP[mode] ?? 'WALK'

    const body: Record<string, unknown> = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode,
    }
    if (travelMode === 'DRIVE') body.routingPreference = 'TRAFFIC_AWARE'
    if (departureTime && (travelMode === 'TRANSIT' || travelMode === 'DRIVE')) {
      body.departureTime = departureTime.toISOString()
    }

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`Routes API request failed: ${res.status} ${await res.text()}`)

    const data: { routes?: Array<{ duration?: string; distanceMeters?: number }> } = await res.json()
    const route = data.routes?.[0]
    if (!route) throw new Error('No route found')

    return {
      minutes: Math.max(1, Math.round(parseDurationSeconds(route.duration) / 60)),
      distanceKm: Math.round(((route.distanceMeters ?? 0) / 1000) * 10) / 10,
    }
  },
}
