import { formatClock } from '../lib/time'
import type { ItineraryOption } from '../types/domain'

interface OptionsStepProps {
  options: ItineraryOption[]
  fallbackNotice?: string
  onChoose: (option: ItineraryOption) => void
  onBack: () => void
}

export function OptionsStep({ options, fallbackNotice, onChoose, onBack }: OptionsStepProps) {
  if (options.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-slate-600 dark:text-slate-300">
          Couldn't put together an itinerary with these settings - try a wider time window, a different genre, or another
          location.
        </p>
        <button type="button" onClick={onBack} className="self-start text-sm font-medium text-violet-600 hover:underline">
          ← Back to preferences
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pick an itinerary</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{options.length} options, ranked by rating.</p>
      </div>

      {fallbackNotice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Showing demo data - live search failed ({fallbackNotice}).
        </p>
      )}

      <div className="flex flex-col gap-4">
        {options.map((option, i) => (
          <div
            key={option.id}
            className="rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Option {i + 1}</span>
              <span className="text-sm font-medium text-amber-500">★ {option.score.toFixed(1)}</span>
            </div>

            <ol className="flex flex-col gap-2">
              {option.stops.map((stop, idx) => (
                <li key={stop.venue.id} className="flex items-baseline gap-3 text-sm">
                  <span className="w-16 shrink-0 tabular-nums text-slate-400">{formatClock(
                    (stop.arrival.getHours() * 60 + stop.arrival.getMinutes())
                  )}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{stop.venue.name}</span>
                  {idx === 0 && <span className="text-xs text-slate-400">nearby</span>}
                </li>
              ))}
            </ol>

            {option.warnings.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {option.warnings.map((w, wi) => (
                  <li key={wi} className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠ {w}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => onChoose(option)}
              className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              Use this itinerary
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-violet-600 hover:underline">
        ← Back to preferences
      </button>
    </div>
  )
}
