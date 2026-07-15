import { hasLiveDataSource } from '../env'
import { mockPlacesProvider } from './mockProvider'
import { googlePlacesProvider } from './googleProvider'
import type { SearchVenuesParams } from './types'
import type { Venue } from '../../types/domain'

export interface VenueSearchResult {
  venues: Venue[]
  usedLiveData: boolean
  fallbackReason?: string
}

/**
 * In live mode, real venues and demo venues must never mix - a fake venue in
 * an otherwise-real itinerary would send someone to a place that doesn't
 * exist. So:
 *  - a live search with zero results retries with a wider radius, then
 *    returns empty (the itinerary builder surfaces a "nothing found" warning)
 *  - only a hard failure of the live call itself (bad key, quota, network)
 *    falls back to demo data, and reports that it did
 */
export async function searchVenues(params: SearchVenuesParams): Promise<VenueSearchResult> {
  if (!hasLiveDataSource) {
    const venues = await mockPlacesProvider.searchVenues(params)
    return { venues, usedLiveData: false }
  }

  try {
    let venues = await googlePlacesProvider.searchVenues(params)
    if (venues.length === 0) {
      venues = await googlePlacesProvider.searchVenues({ ...params, radiusKm: (params.radiusKm ?? 4) * 3 })
    }
    return { venues, usedLiveData: true }
  } catch (err) {
    const venues = await mockPlacesProvider.searchVenues(params)
    return { venues, usedLiveData: false, fallbackReason: (err as Error).message }
  }
}

export type { Venue }
