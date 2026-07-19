import { useState } from 'react'
import { getGenre } from '../data/genres'
import { formatClock } from '../lib/time'
import { getSyncKey, setSyncKey } from '../services/supabase'
import type { SavedItinerary } from '../types/domain'

interface HistoryViewProps {
  itineraries: SavedItinerary[]
  cloud: boolean
  onView: (saved: SavedItinerary) => void
  onDelete: (id: string) => void
  onSyncKeyChanged: () => void
  onBack: () => void
}

export function HistoryView({ itineraries, cloud, onView, onDelete, onSyncKeyChanged, onBack }: HistoryViewProps) {
  const [showSync, setShowSync] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  function copyKey() {
    navigator.clipboard.writeText(getSyncKey()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function applyKey() {
    setSyncError(null)
    if (setSyncKey(keyInput)) {
      setKeyInput('')
      onSyncKeyChanged()
    } else {
      setSyncError("That doesn't look like a sync code - it should look like 123e4567-e89b-...")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Saved itineraries</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {cloud ? 'Synced across your devices.' : 'Stored on this device (offline).'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSync((v) => !v)}
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          {showSync ? 'Hide sync' : 'Sync devices'}
        </button>
      </div>

      {showSync && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-300">
            Your itineraries sync under a private code. To see the same history on another device, copy this code and
            enter it there.
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">
              {getSyncKey()}
            </code>
            <button
              type="button"
              onClick={copyKey}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium dark:border-slate-600"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste a code from another device…"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={applyKey}
              className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white"
            >
              Use code
            </button>
          </div>
          {syncError && <p className="text-xs text-rose-500">{syncError}</p>}
          <p className="text-xs text-slate-400">
            Anyone with this code can see and change these itineraries - share it only with your own devices (or your
            date).
          </p>
        </div>
      )}

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
