import type { StopCategory, Venue } from '../types/domain'

export interface BookingLink {
  label: string
  url: string
  primary?: boolean
}

export interface BookingContext {
  /** Number of people, for reservation links. */
  covers?: number
  /** Arrival time for the stop, to prefill reservation search. */
  dateTime?: Date
}

const RESERVATION_CATEGORIES: StopCategory[] = ['food-casual', 'food-fine-dining']
const EXPERIENCE_CATEGORIES: StopCategory[] = ['adventure-activity', 'outdoor-activity', 'culture', 'entertainment']

function mapsSearchUrl(venue: Venue): string {
  const query = `${venue.name}, ${venue.address}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function openTableUrl(venue: Venue, ctx: BookingContext): string {
  const params = new URLSearchParams({ term: venue.name, covers: String(ctx.covers ?? 2) })
  if (ctx.dateTime) {
    // OpenTable expects local "yyyy-MM-ddTHH:mm"
    const d = ctx.dateTime
    const pad = (n: number) => String(n).padStart(2, '0')
    params.set('dateTime', `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
  }
  return `https://www.opentable.com/s?${params.toString()}`
}

/**
 * Returns real, working links to help book or find each stop, prefilled with
 * the itinerary's date, time and party size where the target site supports it.
 * These are search deep-links, not confirmed reservations - the venue's own
 * site/app has the final say. True one-click automated booking would require a
 * signed partner integration (e.g. OpenTable Partner API, Resy API).
 */
export function getBookingLinks(venue: Venue, ctx: BookingContext = {}): BookingLink[] {
  const links: BookingLink[] = []

  if (venue.website) {
    links.push({ label: 'Visit website', url: venue.website, primary: true })
  }

  if (RESERVATION_CATEGORIES.includes(venue.category)) {
    links.push({ label: 'Book on OpenTable', url: openTableUrl(venue, ctx), primary: !venue.website })
  }

  if (EXPERIENCE_CATEGORIES.includes(venue.category)) {
    links.push({
      label: 'Find on Viator',
      url: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(venue.name)}`,
      primary: !venue.website,
    })
  }

  links.push({ label: 'View on Google Maps', url: mapsSearchUrl(venue) })

  return links
}
