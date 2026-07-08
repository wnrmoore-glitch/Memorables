import { VENUE_POOL } from '../../data/venuePool'
import { offsetLatLng } from '../../lib/geo'
import { hashString, seededRandom } from '../../lib/rand'
import type { Venue } from '../../types/domain'
import type { PlacesProvider, SearchVenuesParams } from './types'

const STREETS = [
  '5th Ave', 'Market St', 'King St', 'Elm St', 'Riverside Dr',
  'Harbor Blvd', 'Union Sq', 'Maple St', 'Grand Ave', 'Church St',
  'Mill Rd', 'Cedar Ln', 'Bridge St', 'Park Row', 'Station Rd',
]

export const mockPlacesProvider: PlacesProvider = {
  name: 'mock',

  async searchVenues({ center, locationLabel, category, radiusKm = 2.2 }: SearchVenuesParams): Promise<Venue[]> {
    const templates = VENUE_POOL.filter((t) => t.category === category)

    return templates.map((template) => {
      const seed = hashString(`${template.name}|${center.lat.toFixed(3)}|${center.lng.toFixed(3)}`)
      const rand = seededRandom(seed)

      const distanceKm = 0.3 + rand() * radiusKm
      const bearing = rand() * 360
      const location = offsetLatLng(center, distanceKm, bearing)

      const ratingJitter = (rand() - 0.5) * 0.3
      const rating = Math.max(3.3, Math.min(5, template.ratingBase + ratingJitter))
      const ratingCount = Math.round(50 + rand() * 1800)

      const street = STREETS[Math.floor(rand() * STREETS.length)]
      const streetNumber = Math.round(10 + rand() * 989)

      const venue: Venue = {
        id: `mock-${seed}`,
        name: template.name,
        category: template.category,
        rating: Math.round(rating * 10) / 10,
        ratingCount,
        priceLevel: template.priceLevel,
        location,
        address: `${streetNumber} ${street}, ${locationLabel}`,
        website: undefined,
        openingHours: template.hours,
        description: template.description,
        source: 'mock',
      }
      return venue
    })
  },
}
