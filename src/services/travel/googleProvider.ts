import { routesPost } from '../googleApi'
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

    const res = await routesPost(body, 'routes.duration,routes.distanceMeters')

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
