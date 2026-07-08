import { CATEGORY_LABELS } from '../data/genres'
import { formatClock } from '../lib/time'
import { getBookingLinks } from '../services/bookingLinks'
import { googleCalendarLink } from '../services/calendar'
import type { ItineraryOption, ItineraryRequest, TravelMode } from '../types/domain'

interface FinalItineraryProps {
  request: ItineraryRequest
  option: ItineraryOption
  regeneratingIndex: number | null
  onRegenerateStop: (index: number) => void
  onDownloadICS: () => void
  onSave: () => void
  saved: boolean
  onStartOver: () => void
}

const TRAVEL_ICON: Record<TravelMode, string> = { walking: '🚶', driving: '🚗', transit: '🚆' }

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

function priceTag(level: number): string {
  return '$'.repeat(level)
}

export function FinalItinerary({
  request,
  option,
  regeneratingIndex,
  onRegenerateStop,
  onDownloadICS,
  onSave,
  saved,
  onStartOver,
}: FinalItineraryProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your itinerary</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {request.date} · {request.location.label}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-600 dark:bg-amber-500/10">
          ★ {option.score.toFixed(1)}
        </span>
      </div>

      {option.warnings.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
          {option.warnings.map((w, i) => (
            <li key={i} className="text-xs text-amber-700 dark:text-amber-400">
              ⚠ {w}
            </li>
          ))}
        </ul>
      )}

      <ol className="flex flex-col">
        {option.stops.map((stop, i) => (
          <li key={stop.venue.id}>
            {stop.travelFromPrevious && (
              <div className="ml-5 flex items-center gap-2 border-l-2 border-dashed border-slate-300 py-2 pl-4 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                {TRAVEL_ICON[stop.travelFromPrevious.mode]} {stop.travelFromPrevious.minutes} min{' '}
                {stop.travelFromPrevious.mode} ({stop.travelFromPrevious.distanceKm} km) + {stop.travelFromPrevious.bufferMinutes}{' '}
                min buffer
              </div>
            )}

            <div className="flex gap-4">
              <div className="w-16 shrink-0 pt-4 text-right text-sm tabular-nums text-slate-500 dark:text-slate-400">
                {formatClock(minutesOfDay(stop.arrival))}
              </div>

              <div className="flex-1 rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-violet-600">
                      {CATEGORY_LABELS[stop.category]}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{stop.venue.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRegenerateStop(i)}
                    disabled={regeneratingIndex !== null}
                    className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:border-violet-400 hover:text-violet-600 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
                  >
                    {regeneratingIndex === i ? 'Swapping…' : '🔄 Swap'}
                  </button>
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stop.venue.description}</p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>★ {stop.venue.rating} ({stop.venue.ratingCount})</span>
                  <span>{priceTag(stop.venue.priceLevel)}</span>
                  <span>{stop.venue.address}</span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {formatClock(minutesOfDay(stop.arrival))} – {formatClock(minutesOfDay(stop.departure))}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {getBookingLinks(stop.venue).map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        link.primary
                          ? 'bg-violet-600 text-white hover:bg-violet-700'
                          : 'border border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-600 dark:border-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                  <a
                    href={googleCalendarLink(stop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-400 hover:text-violet-600 dark:border-slate-600 dark:text-slate-300"
                  >
                    📅 Add to Google Calendar
                  </a>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onDownloadICS}
          className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          ⬇ Download whole day (.ics)
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saved}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
        >
          {saved ? '✓ Saved' : '☆ Save itinerary'}
        </button>
      </div>

      <button type="button" onClick={onStartOver} className="self-start text-sm font-medium text-violet-600 hover:underline">
        ← Start a new date
      </button>
    </div>
  )
}
