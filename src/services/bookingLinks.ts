import type { StopCategory, Venue } from '../types/domain'

export interface BookingLink {
  label: string
  url: string
  primary?: boolean
}

const RESERVATION_CATEGORIES: StopCategory[] = ['food-casual', 'food-fine-dining']
const EXPERIENCE_CATEGORIES: StopCategory[] = ['adventure-activity', 'outdoor-activity', 'culture', 'entertainment']

function mapsSearchUrl(venue: Venue): string {
  const query = `${venue.name}, ${venue.address}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/**
 * Returns real, working links to help book or find each stop. These are search
 * deep-links, not confirmed reservations - the venue's own site/app has the final say.
 * True one-click automated booking would require a signed partner integration
 * (e.g. OpenTable Partner API, Resy API) which needs a business agreement per venue.
 */
export function getBookingLinks(venue: Venue): BookingLink[] {
  const links: BookingLink[] = []

  if (venue.website) {
    links.push({ label: 'Visit website', url: venue.website, primary: true })
  }

  if (RESERVATION_CATEGORIES.includes(venue.category)) {
    links.push({
      label: 'Find on OpenTable',
      url: `https://www.opentable.com/s?term=${encodeURIComponent(venue.name)}&covers=2`,
      primary: !venue.website,
    })
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
