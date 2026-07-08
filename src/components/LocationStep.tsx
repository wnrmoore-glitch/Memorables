import { useState } from 'react'
import { DEMO_LOCATIONS } from '../data/demoLocations'
import { hasLiveDataSource } from '../services/env'
import { geocodeViaGooglePlaces } from '../services/places/googleProvider'
import type { PlaceLocation } from '../types/domain'

interface LocationStepProps {
  onSelect: (location: PlaceLocation) => void
}

export function LocationStep({ onSelect }: LocationStepProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)

  function useCurrentLocation() {
    setError(null)
    setGeoLoading(true)
    if (!navigator.geolocation) {
      setError('Location services are not available in this browser.')
      setGeoLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        onSelect({ label: 'Current location', lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setGeoLoading(false)
        setError('Could not access your location. Check your browser permissions, or pick a place below.')
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    )
  }

  async function handleSearch() {
    if (!query.trim()) return
    setError(null)

    if (!hasLiveDataSource) {
      const match = DEMO_LOCATIONS.find((loc) => loc.label.toLowerCase().includes(query.trim().toLowerCase()))
      if (match) onSelect(match)
      else setError('Demo mode only knows the cities below - add a Google Maps API key for live location search.')
      return
    }

    setSearching(true)
    try {
      const result = await geocodeViaGooglePlaces(query)
      if (result) onSelect(result)
      else setError('Could not find that place. Try being more specific.')
    } catch {
      setError('Location search failed. Try one of the demo cities below.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Where's the date?</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Use your location, or search for a destination.
        </p>
      </div>

      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={geoLoading}
        className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
      >
        {geoLoading ? 'Locating…' : '📍 Use my current location'}
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        or search
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search a city or neighborhood…"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
        >
          {searching ? '…' : 'Go'}
        </button>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {!hasLiveDataSource && (
        <div>
          <p className="mb-2 text-xs text-slate-400">Demo mode - pick a city:</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_LOCATIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() => onSelect(loc)}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-violet-500 hover:text-violet-600 dark:border-slate-600 dark:text-slate-200"
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
