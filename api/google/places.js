// Vercel serverless proxy for the Places API (New). The Google key lives in
// the GOOGLE_MAPS_API_KEY env var (no VITE_ prefix), so it is never shipped
// to the browser.

const ALLOWED_ENDPOINTS = new Set(['searchNearby', 'searchText'])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY is not configured' })
    return
  }

  const { endpoint, fieldMask, body } = req.body ?? {}
  if (!ALLOWED_ENDPOINTS.has(endpoint) || typeof fieldMask !== 'string' || typeof body !== 'object') {
    res.status(400).json({ error: 'Bad request' })
    return
  }

  const upstream = await fetch(`https://places.googleapis.com/v1/places:${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  })

  const text = await upstream.text()
  res.status(upstream.status).setHeader('Content-Type', 'application/json').send(text)
}
