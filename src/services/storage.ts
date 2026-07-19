import { getSyncKey, supabase } from './supabase'
import type { ItineraryOption, ItineraryRequest, SavedItinerary } from '../types/domain'

const STORAGE_KEY = 'memorables:itineraries'

interface CloudRow {
  id: string
  created_at: string
  request: ItineraryRequest
  option: ItineraryOption
}

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

function rowToSaved(row: CloudRow): SavedItinerary {
  return reviveDates({ id: row.id, createdAt: row.created_at, request: row.request, option: row.option })
}

function loadLocal(): SavedItinerary[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return (JSON.parse(raw) as SavedItinerary[]).map(reviveDates)
  } catch {
    return []
  }
}

function saveLocal(all: SavedItinerary[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export interface LoadResult {
  itineraries: SavedItinerary[]
  cloud: boolean
}

/** Cloud-first: reads synced itineraries, falling back to this device's local copies offline. */
export async function loadItineraries(): Promise<LoadResult> {
  try {
    const { data, error } = await supabase.rpc('get_itineraries', { p_user_key: getSyncKey() })
    if (error) throw error
    const itineraries = (data as CloudRow[]).map(rowToSaved)
    saveLocal(itineraries)
    return { itineraries, cloud: true }
  } catch {
    return { itineraries: loadLocal(), cloud: false }
  }
}

export interface SaveResult {
  itinerary: SavedItinerary
  /** True when the save reached Supabase - share links only work for cloud saves. */
  cloud: boolean
}

export async function saveItinerary(request: ItineraryRequest, option: ItineraryOption): Promise<SaveResult> {
  try {
    const { data, error } = await supabase.rpc('save_itinerary', {
      p_user_key: getSyncKey(),
      p_request: request,
      p_option: option,
    })
    if (error) throw error
    const saved = rowToSaved(data as CloudRow)
    saveLocal([saved, ...loadLocal()])
    return { itinerary: saved, cloud: true }
  } catch {
    const saved: SavedItinerary = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      request,
      option,
    }
    saveLocal([saved, ...loadLocal()])
    return { itinerary: saved, cloud: false }
  }
}

export async function deleteItinerary(id: string): Promise<void> {
  try {
    await supabase.rpc('delete_itinerary', { p_user_key: getSyncKey(), p_id: id })
  } catch {
    // local removal below still applies
  }
  saveLocal(loadLocal().filter((s) => s.id !== id))
}

/** Loads a single itinerary by id, for share links (?share=<id>). */
export async function loadSharedItinerary(id: string): Promise<SavedItinerary | null> {
  try {
    const { data, error } = await supabase.rpc('get_shared_itinerary', { p_id: id })
    if (error) throw error
    const row = (data as CloudRow[])[0]
    return row ? rowToSaved(row) : null
  } catch {
    return null
  }
}
