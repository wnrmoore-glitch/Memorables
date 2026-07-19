// Vercel serverless proxy for the Routes API. See places.js for the pattern.

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

  const { fieldMask, body } = req.body ?? {}
  if (typeof fieldMask !== 'string' || typeof body !== 'object') {
    res.status(400).json({ error: 'Bad request' })
    return
  }

  const upstream = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
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
