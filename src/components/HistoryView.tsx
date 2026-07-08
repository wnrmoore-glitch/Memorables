import { getGenre } from '../data/genres'
import { formatClock } from '../lib/time'
import type { SavedItinerary } from '../types/domain'

interface HistoryViewProps {
  itineraries: SavedItinerary[]
  onView: (saved: SavedItinerary) => void
  onDelete: (id: string) => void
  onBack: () => void
}

export function HistoryView({ itineraries, onView, onDelete, onBack }: HistoryViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Saved itineraries</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Stored on this device.</p>
      </div>

      {itineraries.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nothing saved yet.</p>}

      <div className="flex flex-col gap-3">
        {itineraries.map((saved) => {
          const genre = getGenre(saved.request.genreId)
          const first = saved.option.stops[0]
          return (
            <div
              key={saved.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <button type="button" onClick={() => onView(saved)} className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {genre.emoji} {genre.label} · {saved.request.date}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {saved.request.location.label} · starts {first ? formatClock(first.arrival.getHours() * 60 + first.arrival.getMinutes()) : '-'} ·{' '}
                  {saved.option.stops.length} stops
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(saved.id)}
                className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:border-rose-400 hover:text-rose-500 dark:border-slate-600"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>

      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-violet-600 hover:underline">
        ← Back
      </button>
    </div>
  )
}
