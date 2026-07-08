export type TravelMode = 'walking' | 'driving' | 'transit'

export interface LatLng {
  lat: number
  lng: number
}

export interface PlaceLocation extends LatLng {
  label: string
}

export type StopCategory =
  | 'scenic'
  | 'culture'
  | 'entertainment'
  | 'food-casual'
  | 'food-fine-dining'
  | 'coffee'
  | 'dessert'
  | 'drinks-bar'
  | 'nightlife'
  | 'outdoor-activity'
  | 'adventure-activity'
  | 'relax'

export interface OpeningPeriod {
  /** 0 = Sunday ... 6 = Saturday */
  day: number
  /** "HH:mm" 24h */
  open: string
  /** "HH:mm" 24h, may be past midnight (e.g. "01:30") meaning it closes the next day */
  close: string
}

export interface Venue {
  id: string
  name: string
  category: StopCategory
  rating: number
  ratingCount: number
  priceLevel: 1 | 2 | 3 | 4
  location: LatLng
  address: string
  website?: string
  openingHours: OpeningPeriod[]
  description: string
  source: 'mock' | 'google'
}

export interface Genre {
  id: string
  label: string
  emoji: string
  description: string
  sequences: Record<number, StopCategory[]>
}

export interface TimeWindow {
  /** "HH:mm" */
  start: string
  /** "HH:mm" */
  end: string
}

export interface ItineraryRequest {
  location: PlaceLocation
  date: string // "yyyy-MM-dd"
  window: TimeWindow
  genreId: string
  stopCount: number
  travelMode: TravelMode
  bufferMinutes: number
}

export interface TravelSegment {
  mode: TravelMode
  minutes: number
  distanceKm: number
  bufferMinutes: number
}

export interface ItineraryStop {
  venue: Venue
  category: StopCategory
  arrival: Date
  departure: Date
  travelFromPrevious?: TravelSegment
}

export interface ItineraryOption {
  id: string
  stops: ItineraryStop[]
  score: number
  warnings: string[]
}

export interface SavedItinerary {
  id: string
  createdAt: string
  request: ItineraryRequest
  option: ItineraryOption
}
