import type { LatLng, StopCategory, Venue } from '../../types/domain'

export interface SearchVenuesParams {
  center: LatLng
  locationLabel: string
  category: StopCategory
  radiusKm?: number
}

export interface PlacesProvider {
  readonly name: 'mock' | 'google'
  searchVenues(params: SearchVenuesParams): Promise<Venue[]>
}
