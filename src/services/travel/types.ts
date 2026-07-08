import type { LatLng, TravelMode } from '../../types/domain'

export interface TravelQuery {
  origin: LatLng
  destination: LatLng
  mode: TravelMode
  /** Estimated departure time for this leg - improves accuracy for transit/traffic-aware modes. */
  departureTime?: Date
}

export interface TravelResult {
  minutes: number
  distanceKm: number
}

export interface TravelProvider {
  readonly name: 'mock' | 'google'
  getTravelTime(query: TravelQuery): Promise<TravelResult>
}
