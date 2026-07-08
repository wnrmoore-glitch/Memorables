import { haversineKm } from '../../lib/geo'
import { hashString, seededRandom } from '../../lib/rand'
import type { TravelProvider, TravelQuery, TravelResult } from './types'

/** Effective average speeds (km/h) accounting for lights, stops and turns, not straight-line cruising. */
const MODE_SPEED_KMH: Record<string, number> = {
  walking: 4.8,
  driving: 24,
  transit: 17,
}

/** Road/path distance tends to exceed straight-line distance by this factor. */
const ROUTING_FACTOR: Record<string, number> = {
  walking: 1.2,
  driving: 1.4,
  transit: 1.3,
}

/** Fixed overhead for transit (waiting for the next departure). */
const MODE_OVERHEAD_MIN: Record<string, number> = {
  walking: 0,
  driving: 2, // parking
  transit: 6,
}

export const mockTravelProvider: TravelProvider = {
  name: 'mock',

  async getTravelTime({ origin, destination, mode }: TravelQuery): Promise<TravelResult> {
    const straightLineKm = haversineKm(origin, destination)
    const routedKm = straightLineKm * (ROUTING_FACTOR[mode] ?? 1.3)

    const seed = hashString(`${origin.lat},${origin.lng}->${destination.lat},${destination.lng}:${mode}`)
    const rand = seededRandom(seed)
    const trafficJitter = 0.9 + rand() * 0.3 // +/-15% variability

    const speed = MODE_SPEED_KMH[mode] ?? 20
    const travelMinutes = (routedKm / speed) * 60 * trafficJitter
    const minutes = Math.max(3, Math.round(travelMinutes + (MODE_OVERHEAD_MIN[mode] ?? 0)))

    return { minutes, distanceKm: Math.round(routedKm * 10) / 10 }
  },
}
