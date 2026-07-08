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
 * Tries the live Google Places provider when an API key is configured, and
 * silently falls back to demo data if the live call fails (bad key, quota,
 * network/CORS) so the app never hard-blocks on an external dependency.
 */
export async function searchVenues(params: SearchVenuesParams): Promise<VenueSearchResult> {
  if (!hasLiveDataSource) {
    const venues = await mockPlacesProvider.searchVenues(params)
    return { venues, usedLiveData: false }
  }

  try {
    const venues = await googlePlacesProvider.searchVenues(params)
    if (venues.length === 0) throw new Error('No live results')
    return { venues, usedLiveData: true }
  } catch (err) {
    const venues = await mockPlacesProvider.searchVenues(params)
    return { venues, usedLiveData: false, fallbackReason: (err as Error).message }
  }
}

export type { Venue }
