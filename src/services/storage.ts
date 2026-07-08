import type { ItineraryOption, ItineraryRequest, SavedItinerary } from '../types/domain'

const STORAGE_KEY = 'memorables:itineraries'

function reviveDates(saved: SavedItinerary): SavedItinerary {
  return {
    ...saved,
    option: {
      ...saved.option,
      stops: saved.option.stops.map((s) => ({
        ...s,
        arrival: new Date(s.arrival),
        departure: new Date(s.departure),
      })),
    },
  }
}

export function loadItineraries(): SavedItinerary[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as SavedItinerary[]
    return parsed.map(reviveDates)
  } catch {
    return []
  }
}

export function saveItinerary(request: ItineraryRequest, option: ItineraryOption): SavedItinerary {
  const saved: SavedItinerary = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    request,
    option,
  }
  const all = [saved, ...loadItineraries()]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return saved
}

export function deleteItinerary(id: string): void {
  const all = loadItineraries().filter((s) => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
