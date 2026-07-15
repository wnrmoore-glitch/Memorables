import { GOOGLE_MAPS_API_KEY } from '../env'
import type { OpeningPeriod, Venue } from '../../types/domain'
import type { PlacesProvider, SearchVenuesParams } from './types'

/**
 * Places API (New) `includedType` values per stop category. Fine dining and
 * casual food both search "restaurant" - they're told apart afterwards by price level.
 * https://developers.google.com/maps/documentation/places/web-service/place-types
 */
const CATEGORY_TYPES: Record<string, string[]> = {
  scenic: ['tourist_attraction', 'park'],
  culture: ['museum', 'art_gallery'],
  entertainment: ['performing_arts_theater', 'movie_theater', 'night_club'],
  'food-casual': ['restaurant'],
  'food-fine-dining': ['restaurant'],
  coffee: ['cafe'],
  dessert: ['dessert_shop', 'bakery'],
  'drinks-bar': ['bar', 'wine_bar'],
  nightlife: ['night_club'],
  'outdoor-activity': ['park', 'hiking_area'],
  'adventure-activity': ['amusement_park', 'tourist_attraction'],
  relax: ['spa'],
}

const PRICE_LEVEL_MAP: Record<string, 1 | 2 | 3 | 4> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

const ALWAYS_OPEN: OpeningPeriod[] = Array.from({ length: 7 }, (_, day) => ({
  day,
  open: '00:00',
  close: '23:59',
}))

/**
 * Places whose type list contains any of these are never date-material, even
 * when they technically match an included type (e.g. a supermarket with an
 * in-store bakery matches "bakery").
 */
const EXCLUDED_PLACE_TYPES = new Set([
  'grocery_store',
  'supermarket',
  'convenience_store',
  'gas_station',
  'shopping_mall',
  'department_store',
])

interface GooglePlace {
  id: string
  displayName?: { text: string }
  types?: string[]
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  location?: { latitude: number; longitude: number }
  formattedAddress?: string
  websiteUri?: string
  editorialSummary?: { text: string }
  regularOpeningHours?: {
    periods?: Array<{
      open: { day: number; hour: number; minute: number }
      close?: { day: number; hour: number; minute: number }
    }>
  }
}

function toOpeningHours(place: GooglePlace): OpeningPeriod[] {
  const periods = place.regularOpeningHours?.periods
  if (!periods || periods.length === 0) return ALWAYS_OPEN
  return periods
    .filter((p) => p.close)
    .map((p) => ({
      day: p.open.day,
      open: `${String(p.open.hour).padStart(2, '0')}:${String(p.open.minute).padStart(2, '0')}`,
      close: `${String(p.close!.hour).padStart(2, '0')}:${String(p.close!.minute).padStart(2, '0')}`,
    }))
}

function toVenue(place: GooglePlace, category: SearchVenuesParams['category']): Venue | null {
  if (!place.location || !place.displayName) return null
  if (place.types?.some((t) => EXCLUDED_PLACE_TYPES.has(t))) return null
  return {
    id: `google-${place.id}`,
    name: place.displayName.text,
    category,
    rating: place.rating ?? 4,
    ratingCount: place.userRatingCount ?? 0,
    priceLevel: place.priceLevel ? PRICE_LEVEL_MAP[place.priceLevel] ?? 2 : 2,
    location: { lat: place.location.latitude, lng: place.location.longitude },
    address: place.formattedAddress ?? 'Address unavailable',
    website: place.websiteUri,
    openingHours: toOpeningHours(place),
    description: place.editorialSummary?.text ?? '',
    source: 'google',
  }
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.types',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.location',
  'places.formattedAddress',
  'places.websiteUri',
  'places.editorialSummary',
  'places.regularOpeningHours',
].join(',')

export const googlePlacesProvider: PlacesProvider = {
  name: 'google',

  async searchVenues({ center, category, radiusKm = 4 }: SearchVenuesParams): Promise<Venue[]> {
    if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY')

    const includedTypes = CATEGORY_TYPES[category] ?? []

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 12,
        locationRestriction: {
          circle: {
            center: { latitude: center.lat, longitude: center.lng },
            radius: radiusKm * 1000,
          },
        },
      }),
    })

    if (!res.ok) {
      throw new Error(`Places API request failed: ${res.status} ${await res.text()}`)
    }

    const data: { places?: GooglePlace[] } = await res.json()
    const venues = (data.places ?? [])
      .map((place) => toVenue(place, category))
      .filter((v): v is Venue => v !== null)

    if (category === 'food-fine-dining') return venues.filter((v) => v.priceLevel >= 3)
    if (category === 'food-casual') return venues.filter((v) => v.priceLevel <= 2)
    return venues
  },
}

/** Resolves free-text location input (e.g. "Shoreditch, London") to coordinates via Places Text Search. */
export async function geocodeViaGooglePlaces(query: string): Promise<{ lat: number; lng: number; label: string } | null> {
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY')

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': 'places.location,places.formattedAddress,places.displayName',
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
  })

  if (!res.ok) throw new Error(`Places text search failed: ${res.status}`)

  const data: { places?: GooglePlace[] } = await res.json()
  const place = data.places?.[0]
  if (!place?.location) return null

  return {
    lat: place.location.latitude,
    lng: place.location.longitude,
    label: place.formattedAddress ?? query,
  }
}
