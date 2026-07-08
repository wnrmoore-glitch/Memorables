import { hasLiveDataSource } from '../env'
import { mockTravelProvider } from './mockProvider'
import { googleTravelProvider } from './googleProvider'
import type { TravelQuery, TravelResult } from './types'

export async function getTravelTime(query: TravelQuery): Promise<TravelResult & { usedLiveData: boolean }> {
  if (!hasLiveDataSource) {
    return { ...(await mockTravelProvider.getTravelTime(query)), usedLiveData: false }
  }

  try {
    return { ...(await googleTravelProvider.getTravelTime(query)), usedLiveData: true }
  } catch {
    return { ...(await mockTravelProvider.getTravelTime(query)), usedLiveData: false }
  }
}
