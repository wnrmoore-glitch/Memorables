import { GOOGLE_MAPS_API_KEY, useApiProxy } from './env'

/**
 * Single seam for talking to Google's Places / Routes APIs. In local dev the
 * key is in VITE_GOOGLE_MAPS_API_KEY and calls go direct; in production the
 * key stays server-side and calls route through the /api/google/* proxy
 * functions so it never appears in the browser bundle.
 */

async function directPost(url: string, body: unknown, fieldMask: string): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY!,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  })
}

export async function placesPost(endpoint: 'searchNearby' | 'searchText', body: unknown, fieldMask: string): Promise<Response> {
  if (useApiProxy) {
    return fetch('/api/google/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, fieldMask, body }),
    })
  }
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY')
  return directPost(`https://places.googleapis.com/v1/places:${endpoint}`, body, fieldMask)
}

export async function routesPost(body: unknown, fieldMask: string): Promise<Response> {
  if (useApiProxy) {
    return fetch('/api/google/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldMask, body }),
    })
  }
  if (!GOOGLE_MAPS_API_KEY) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY')
  return directPost('https://routes.googleapis.com/directions/v2:computeRoutes', body, fieldMask)
}

/** URL for a place photo, given the photo resource name from the Places response. */
export function photoUrl(photoName: string, maxHeightPx = 480): string {
  if (useApiProxy) {
    return `/api/google/photo?name=${encodeURIComponent(photoName)}&h=${maxHeightPx}`
  }
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeightPx}&key=${GOOGLE_MAPS_API_KEY}`
}
