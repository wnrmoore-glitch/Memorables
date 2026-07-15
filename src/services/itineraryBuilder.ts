import { CATEGORY_DURATION_MINUTES, getGenre, getSequence } from '../data/genres'
import { haversineKm } from '../lib/geo'
import { addMinutesToDate, dateAtMidnight, nextOpeningOnOrAfter, parseHM, weekdayOf } from '../lib/time'
import { searchVenues } from './places'
import { getTravelTime } from './travel'
import type {
  ItineraryOption,
  ItineraryRequest,
  ItineraryStop,
  LatLng,
  StopCategory,
  TravelMode,
  TravelSegment,
  Venue,
} from '../types/domain'

export interface BuildResult {
  options: ItineraryOption[]
  usedLiveData: boolean
}

const WINDOW_OVERRUN_GRACE_MIN = 30
/**
 * Rating points "spent" per km of distance from the previous stop, when
 * ranking candidates. Walking is punished hardest - a 5-star venue an hour's
 * walk away is a worse pick than a 4.3 ten minutes away.
 */
const PROXIMITY_PENALTY_PER_KM: Record<TravelMode, number> = {
  walking: 0.6,
  transit: 0.25,
  driving: 0.1,
}
/** Small nudge so different itinerary options don't all reuse the same handful of venues. */
const DIVERSITY_BONUS = 0.2
/** Don't ask someone to wait around more than this long for a venue to open. */
const MAX_WAIT_FOR_OPENING_MIN = 150
/** Waits longer than this are worth calling out so the plan doesn't look like it has a gap. */
const NOTABLE_WAIT_MIN = 20
/**
 * Venue search radius per travel mode - on foot, "nearby" means something
 * very different than behind the wheel.
 */
const SEARCH_RADIUS_KM: Record<TravelMode, number> = {
  walking: 2,
  transit: 5,
  driving: 10,
}

async function candidatesByCategory(
  request: ItineraryRequest,
  categories: StopCategory[]
): Promise<{ byCategory: Map<StopCategory, Venue[]>; usedLiveData: boolean }> {
  const unique = Array.from(new Set(categories))
  const byCategory = new Map<StopCategory, Venue[]>()
  const liveByCategory = new Map<StopCategory, boolean>()

  await Promise.all(
    unique.map(async (category) => {
      const result = await searchVenues({
        center: request.location,
        locationLabel: request.location.label,
        category,
        radiusKm: SEARCH_RADIUS_KM[request.travelMode],
      })
      liveByCategory.set(category, result.usedLiveData)
      byCategory.set(category, result.venues)
    })
  )

  // Never mix real and demo venues in one itinerary: if any category came back
  // with live data, discard demo results for the categories that fell back -
  // an empty slot (with its warning) beats sending someone to a venue that
  // doesn't exist.
  const anyLive = [...liveByCategory.values()].some(Boolean)
  if (anyLive) {
    for (const [category, isLive] of liveByCategory) {
      if (!isLive) byCategory.set(category, [])
    }
  }

  return { byCategory, usedLiveData: anyLive }
}

/** Ranks candidates by a blend of rating and closeness to where the previous stop left off. */
function rankCandidates(candidates: Venue[], currentLocation: LatLng, mode: TravelMode, usedInOtherOptions: Set<string>): Venue[] {
  return [...candidates].sort((a, b) => scoreCandidate(b, currentLocation, mode, usedInOtherOptions) - scoreCandidate(a, currentLocation, mode, usedInOtherOptions))
}

function scoreCandidate(venue: Venue, currentLocation: LatLng, mode: TravelMode, usedInOtherOptions: Set<string>): number {
  const distanceKm = haversineKm(currentLocation, venue.location)
  const diversityBonus = usedInOtherOptions.has(venue.id) ? 0 : DIVERSITY_BONUS
  return venue.rating - distanceKm * PROXIMITY_PENALTY_PER_KM[mode] + diversityBonus
}

interface ChainStepResult {
  stop: ItineraryStop
  warning?: string
}

async function pickStep(
  category: StopCategory,
  candidates: Venue[],
  usedVenueIds: Set<string>,
  currentLocation: LatLng,
  cursorMin: number,
  request: ItineraryRequest,
  dateMidnight: Date,
  weekday: number,
  windowEndMin: number,
  usedInOtherOptions: Set<string>
): Promise<ChainStepResult | null> {
  const duration = CATEGORY_DURATION_MINUTES[category] ?? 60
  const pool = candidates.filter((v) => !usedVenueIds.has(v.id))
  if (pool.length === 0) return null

  const ranked = rankCandidates(pool, currentLocation, request.travelMode, usedInOtherOptions)

  let bestFallback: { venue: Venue; travel: TravelSegment; arrival: Date; departure: Date; warning: string } | null = null

  for (const venue of ranked) {
    const departureTimeEstimate = addMinutesToDate(dateMidnight, cursorMin)
    const travel = await getTravelTime({
      origin: currentLocation,
      destination: venue.location,
      mode: request.travelMode,
      departureTime: departureTimeEstimate,
    })

    const earliestArrivalMin = cursorMin + travel.minutes + request.bufferMinutes
    const segment: TravelSegment = {
      mode: request.travelMode,
      minutes: travel.minutes,
      distanceKm: travel.distanceKm,
      bufferMinutes: request.bufferMinutes,
    }

    // Find the earliest the venue can actually take this stop, waiting for opening if needed.
    const openArrivalMin = nextOpeningOnOrAfter(venue, weekday, earliestArrivalMin, duration)

    if (openArrivalMin === null) {
      if (!bestFallback) {
        bestFallback = {
          venue,
          travel: segment,
          arrival: addMinutesToDate(dateMidnight, earliestArrivalMin),
          departure: addMinutesToDate(dateMidnight, earliestArrivalMin + duration),
          warning: `${venue.name} may be closed at this time - worth double-checking hours.`,
        }
      }
      continue
    }

    const departureMin = openArrivalMin + duration
    const wait = openArrivalMin - earliestArrivalMin
    const arrival = addMinutesToDate(dateMidnight, openArrivalMin)
    const departure = addMinutesToDate(dateMidnight, departureMin)

    if (departureMin <= windowEndMin && wait <= MAX_WAIT_FOR_OPENING_MIN) {
      const stop: ItineraryStop = { venue, category, arrival, departure, travelFromPrevious: segment }
      if (wait > NOTABLE_WAIT_MIN) {
        return { stop, warning: `${Math.round(wait)} min free before ${venue.name} opens - grab a coffee nearby or stroll around.` }
      }
      return { stop }
    }

    if (departureMin > windowEndMin) {
      if (!bestFallback && departureMin <= windowEndMin + WINDOW_OVERRUN_GRACE_MIN) {
        bestFallback = { venue, travel: segment, arrival, departure, warning: `${venue.name} runs a little past your end time.` }
      }
    } else if (!bestFallback) {
      bestFallback = {
        venue,
        travel: segment,
        arrival,
        departure,
        warning: `That's a long wait (~${Math.round(wait)} min) for ${venue.name} to open - maybe pick a different spot.`,
      }
    }
  }

  if (!bestFallback) return null
  return {
    stop: {
      venue: bestFallback.venue,
      category,
      arrival: bestFallback.arrival,
      departure: bestFallback.departure,
      travelFromPrevious: bestFallback.travel,
    },
    warning: bestFallback.warning,
  }
}

async function buildChain(
  sequence: StopCategory[],
  byCategory: Map<StopCategory, Venue[]>,
  request: ItineraryRequest,
  dateMidnight: Date,
  weekday: number,
  windowStartMin: number,
  windowEndMin: number,
  usedInOtherOptions: Set<string>,
  forceFirstVenueId?: string
): Promise<ItineraryOption | null> {
  const stops: ItineraryStop[] = []
  const warnings: string[] = []
  const usedVenueIds = new Set<string>()
  let cursorMin = windowStartMin
  let currentLocation: LatLng = request.location

  for (let i = 0; i < sequence.length; i++) {
    const category = sequence[i]
    let candidates = byCategory.get(category) ?? []

    if (i === 0 && forceFirstVenueId) {
      const forced = candidates.find((v) => v.id === forceFirstVenueId)
      if (forced) candidates = [forced, ...candidates.filter((v) => v.id !== forceFirstVenueId)]
    }

    const result = await pickStep(
      category,
      candidates,
      usedVenueIds,
      currentLocation,
      cursorMin,
      request,
      dateMidnight,
      weekday,
      windowEndMin,
      usedInOtherOptions
    )

    if (!result) {
      warnings.push(`Couldn't find an open ${category.replace('-', ' ')} spot nearby - try widening your time window.`)
      continue
    }

    if (result.warning) warnings.push(result.warning)
    stops.push(result.stop)
    usedVenueIds.add(result.stop.venue.id)
    currentLocation = result.stop.venue.location
    cursorMin = (result.stop.departure.getTime() - dateMidnight.getTime()) / 60_000
  }

  if (stops.length === 0) return null

  const score = stops.reduce((sum, s) => sum + s.venue.rating, 0) / stops.length

  return {
    id: `opt-${stops.map((s) => s.venue.id).join('-')}`,
    stops,
    score: Math.round(score * 100) / 100,
    warnings,
  }
}

export async function buildItineraryOptions(request: ItineraryRequest, optionCount = 3): Promise<BuildResult> {
  const genre = getGenre(request.genreId)
  const sequence = getSequence(genre, request.stopCount)
  const dateMidnight = dateAtMidnight(request.date)
  const weekday = weekdayOf(request.date)
  const windowStartMin = parseHM(request.window.start)
  let windowEndMin = parseHM(request.window.end)
  if (windowEndMin <= windowStartMin) windowEndMin += 1440

  const { byCategory, usedLiveData } = await candidatesByCategory(request, sequence)

  const firstCategoryVenues = rankCandidates(byCategory.get(sequence[0]) ?? [], request.location, request.travelMode, new Set())
  const usedInOtherOptions = new Set<string>()
  const options: ItineraryOption[] = []
  const seenChainKeys = new Set<string>()

  const firstStopCandidates = firstCategoryVenues.slice(0, Math.max(optionCount, 3))

  for (let i = 0; i < firstStopCandidates.length && options.length < optionCount; i++) {
    const option = await buildChain(
      sequence,
      byCategory,
      request,
      dateMidnight,
      weekday,
      windowStartMin,
      windowEndMin,
      usedInOtherOptions,
      firstStopCandidates[i].id
    )
    if (!option) continue
    if (seenChainKeys.has(option.id)) continue

    seenChainKeys.add(option.id)
    option.stops.forEach((s) => usedInOtherOptions.add(s.venue.id))
    options.push(option)
  }

  options.sort((a, b) => b.score - a.score)

  return { options, usedLiveData }
}

export async function regenerateStop(
  request: ItineraryRequest,
  option: ItineraryOption,
  stopIndex: number
): Promise<ItineraryOption> {
  const genre = getGenre(request.genreId)
  const sequence = getSequence(genre, request.stopCount)
  const dateMidnight = dateAtMidnight(request.date)
  const weekday = weekdayOf(request.date)
  const windowStartMin = parseHM(request.window.start)
  let windowEndMin = parseHM(request.window.end)
  if (windowEndMin <= windowStartMin) windowEndMin += 1440

  const { byCategory } = await candidatesByCategory(request, sequence)

  // Exclude every venue already in the itinerary, including the one being replaced,
  // so the regenerated stop is guaranteed to be different.
  const excludeIds = new Set(option.stops.map((s) => s.venue.id))

  const priorStops = option.stops.slice(0, stopIndex)
  const cursorMin =
    stopIndex === 0
      ? windowStartMin
      : (priorStops[priorStops.length - 1].departure.getTime() - dateMidnight.getTime()) / 60_000
  const currentLocation: LatLng = stopIndex === 0 ? request.location : priorStops[priorStops.length - 1].venue.location

  const category = sequence[stopIndex]
  const candidates = byCategory.get(category) ?? []

  const result = await pickStep(
    category,
    candidates,
    excludeIds,
    currentLocation,
    cursorMin,
    request,
    dateMidnight,
    weekday,
    windowEndMin,
    new Set()
  )

  if (!result) return option

  // Rebuild everything after the swapped stop so travel times/arrivals stay consistent.
  const newStops = [...priorStops, result.stop]
  let cursor = (result.stop.departure.getTime() - dateMidnight.getTime()) / 60_000
  let location = result.stop.venue.location
  const usedVenueIds = new Set(newStops.map((s) => s.venue.id))
  const warnings = result.warning ? [result.warning] : []

  for (let i = stopIndex + 1; i < sequence.length; i++) {
    const cat = sequence[i]
    const cands = byCategory.get(cat) ?? []
    const step = await pickStep(cat, cands, usedVenueIds, location, cursor, request, dateMidnight, weekday, windowEndMin, new Set())
    if (!step) continue
    if (step.warning) warnings.push(step.warning)
    newStops.push(step.stop)
    usedVenueIds.add(step.stop.venue.id)
    location = step.stop.venue.location
    cursor = (step.stop.departure.getTime() - dateMidnight.getTime()) / 60_000
  }

  const score = newStops.reduce((sum, s) => sum + s.venue.rating, 0) / newStops.length

  return {
    id: `opt-${newStops.map((s) => s.venue.id).join('-')}`,
    stops: newStops,
    score: Math.round(score * 100) / 100,
    warnings,
  }
}
