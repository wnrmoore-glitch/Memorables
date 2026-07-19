import { getGenre } from '../data/genres'
import { getBookingLinks } from './bookingLinks'
import type { ItineraryOption, ItineraryRequest, ItineraryStop } from '../types/domain'

function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICSText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

/** Folds a content line to <=75 octets as required by RFC 5545. */
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = ' ' + rest.slice(75)
  }
  parts.push(rest)
  return parts.join('\r\n')
}

function stopDescription(stop: ItineraryStop): string {
  const lines = [stop.venue.description, `Address: ${stop.venue.address}`, `Rating: ${stop.venue.rating} (${stop.venue.ratingCount} reviews)`]
  if (stop.travelFromPrevious) {
    lines.push(
      `Getting here: ~${stop.travelFromPrevious.minutes} min ${stop.travelFromPrevious.mode} + ${stop.travelFromPrevious.bufferMinutes} min buffer`
    )
  }
  const links = getBookingLinks(stop.venue, { dateTime: stop.arrival })
  if (links.length) lines.push('Links: ' + links.map((l) => `${l.label} ${l.url}`).join(' | '))
  return lines.join('\n')
}

export function buildICS(request: ItineraryRequest, option: ItineraryOption): string {
  const genre = getGenre(request.genreId)
  const now = toICSDate(new Date())

  const events = option.stops.map((stop, i) => {
    const uid = `memorables-${option.id}-${i}@memorables.app`
    return [
      'BEGIN:VEVENT',
      foldLine(`UID:${uid}`),
      `DTSTAMP:${now}`,
      `DTSTART:${toICSDate(stop.arrival)}`,
      `DTEND:${toICSDate(stop.departure)}`,
      foldLine(`SUMMARY:${escapeICSText(stop.venue.name)}`),
      foldLine(`DESCRIPTION:${escapeICSText(stopDescription(stop))}`),
      foldLine(`LOCATION:${escapeICSText(stop.venue.address)}`),
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Memorables//Date Itinerary//EN',
    'CALSCALE:GREGORIAN',
    foldLine(`X-WR-CALNAME:${escapeICSText(`${genre.label} date - ${request.date}`)}`),
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function googleCalendarLink(stop: ItineraryStop): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: stop.venue.name,
    dates: `${toICSDate(stop.arrival)}/${toICSDate(stop.departure)}`,
    details: stopDescription(stop),
    location: stop.venue.address,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
