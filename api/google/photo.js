// Vercel serverless proxy for Places photos: resolves the photo resource name
// to Google's short-lived image URL and redirects the browser to it.

const NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

export default async function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY is not configured' })
    return
  }

  const name = req.query.name
  const height = Math.min(Number(req.query.h) || 480, 1200)
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    res.status(400).json({ error: 'Bad photo name' })
    return
  }

  const upstream = await fetch(
    `https://places.googleapis.com/v1/${name}/media?maxHeightPx=${height}&skipHttpRedirect=true&key=${key}`
  )
  if (!upstream.ok) {
    res.status(upstream.status).json({ error: 'Photo fetch failed' })
    return
  }

  const data = await upstream.json()
  if (!data.photoUri) {
    res.status(404).json({ error: 'No photo' })
    return
  }

  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.redirect(302, data.photoUri)
}
