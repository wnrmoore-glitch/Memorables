import type { Venue } from '../types/domain'

export function parseHM(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

export function formatHM(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function formatClock(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const min = m % 60
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(min).padStart(2, '0')} ${period}`
}

/** Midnight of the given yyyy-MM-dd date, in local time. */
export function dateAtMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function addMinutesToDate(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000)
}

export function weekdayOf(dateStr: string): number {
  return dateAtMidnight(dateStr).getDay()
}

/**
 * Finds the earliest feasible start time (minutes since midnight) at or after
 * `minMinute` that fits the full `duration` before the venue closes, on the
 * itinerary's weekday. Returns null if no period that day can fit it.
 *
 * If `minMinute` already falls inside an open period, the result equals
 * `minMinute` (no wait). If it falls before opening, the result is the venue's
 * opening time - i.e. the visit is pushed back to wait for it to open, which is
 * exactly how a dinner reservation later in the window should behave.
 */
export function nextOpeningOnOrAfter(venue: Venue, weekday: number, minMinute: number, duration: number): number | null {
  const periods = venue.openingHours.filter((p) => p.day === weekday)
  let best: number | null = null
  for (const period of periods) {
    const open = parseHM(period.open)
    let close = parseHM(period.close)
    if (close <= open) close += 1440
    const start = Math.max(open, minMinute)
    if (start + duration <= close && (best === null || start < best)) {
      best = start
    }
  }
  return best
}
