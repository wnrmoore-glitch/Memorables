import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { GENRES } from '../data/genres'
import { getDayForecast, type DayForecast } from '../services/weather'
import type { ItineraryRequest, PlaceLocation, TravelMode } from '../types/domain'

interface PreferencesStepProps {
  location: PlaceLocation
  onChangeLocation: () => void
  onSubmit: (prefs: Omit<ItineraryRequest, 'location'>) => void
}

const TRAVEL_MODES: { id: TravelMode; label: string; emoji: string }[] = [
  { id: 'walking', label: 'Walking', emoji: '🚶' },
  { id: 'driving', label: 'Driving', emoji: '🚗' },
  { id: 'transit', label: 'Transit', emoji: '🚆' },
]

export function PreferencesStep({ location, onChangeLocation, onSubmit }: PreferencesStepProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [windowStart, setWindowStart] = useState('12:00')
  const [windowEnd, setWindowEnd] = useState('21:00')
  const [genreId, setGenreId] = useState(GENRES[0].id)
  const [stopCount, setStopCount] = useState(3)
  const [travelMode, setTravelMode] = useState<TravelMode>('walking')
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [partySize, setPartySize] = useState(2)
  const [maxPriceLevel, setMaxPriceLevel] = useState<1 | 2 | 3 | 4>(4)
  const [forecast, setForecast] = useState<DayForecast | null>(null)

  useEffect(() => {
    let cancelled = false
    setForecast(null)
    getDayForecast(location, date).then((f) => {
      if (!cancelled) setForecast(f)
    })
    return () => {
      cancelled = true
    }
  }, [location, date])

  function handleSubmit() {
    onSubmit({
      date,
      window: { start: windowStart, end: windowEnd },
      genreId,
      stopCount,
      travelMode,
      bufferMinutes,
      partySize,
      maxPriceLevel,
      indoorPreferred: forecast?.suggestIndoor ?? false,
    })
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Plan the day</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">📍 {location.label}</p>
        </div>
        <button type="button" onClick={onChangeLocation} className="text-sm font-medium text-violet-600 hover:underline">
          Change
        </button>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">What kind of date?</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GENRES.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => setGenreId(genre.id)}
              className={`rounded-xl border p-3 text-left transition ${
                genreId === genre.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                  : 'border-slate-200 hover:border-violet-300 dark:border-slate-700'
              }`}
            >
              <div className="text-2xl">{genre.emoji}</div>
              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{genre.label}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{genre.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Stops</span>
          <div className="flex gap-1.5">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStopCount(n)}
                className={`flex-1 rounded-lg border py-2 font-medium ${
                  stopCount === n
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10'
                    : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Start time</span>
          <input
            type="time"
            value={windowStart}
            onChange={(e) => setWindowStart(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">End by</span>
          <input
            type="time"
            value={windowEnd}
            onChange={(e) => setWindowEnd(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Party size</span>
          <div className="flex gap-1.5">
            {[2, 3, 4, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPartySize(n)}
                className={`flex-1 rounded-lg border py-2 font-medium ${
                  partySize === n
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10'
                    : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Budget</span>
          <div className="flex gap-1.5">
            {([1, 2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxPriceLevel(n)}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium ${
                  maxPriceLevel === n
                    ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10'
                    : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                }`}
              >
                {'$'.repeat(n)}
              </button>
            ))}
          </div>
        </label>
      </section>

      {forecast && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            forecast.suggestIndoor
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300'
              : 'bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300'
          }`}
        >
          {forecast.emoji} {forecast.summary}, {forecast.maxTempC}°C · {forecast.precipitationChance}% chance of rain
          {forecast.suggestIndoor && ' — outdoor stops will be swapped for indoor ones.'}
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Getting around</h3>
        <div className="flex gap-2">
          {TRAVEL_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setTravelMode(m.id)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                travelMode === m.id
                  ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10'
                  : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span>Leeway between stops</span>
          <span className="font-normal text-slate-500 dark:text-slate-400">{bufferMinutes} min</span>
        </h3>
        <input
          type="range"
          min={5}
          max={40}
          step={5}
          value={bufferMinutes}
          onChange={(e) => setBufferMinutes(Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <p className="mt-1 text-xs text-slate-400">Extra buffer added on top of travel time, in case things run long.</p>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded-xl bg-violet-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-violet-700"
      >
        Build my itinerary
      </button>
    </div>
  )
}
