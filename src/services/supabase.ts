import { createClient } from '@supabase/supabase-js'

// The publishable key is safe to ship in the client: the table has RLS enabled
// with no policies, so the only access path is the security-definer RPCs, each
// of which requires the caller to present an unguessable per-user sync key.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://ilbrlxbxlhcjjzpepvyf.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_3qHcsMJmxRmopxAGxRiGEw_00-77jHh'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const USER_KEY_STORAGE = 'memorables:sync-key'

/** The device's sync key - generated once, shareable to link other devices. */
export function getSyncKey(): string {
  let key = localStorage.getItem(USER_KEY_STORAGE)
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem(USER_KEY_STORAGE, key)
  }
  return key
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function setSyncKey(key: string): boolean {
  const trimmed = key.trim().toLowerCase()
  if (!UUID_RE.test(trimmed)) return false
  localStorage.setItem(USER_KEY_STORAGE, trimmed)
  return true
}
