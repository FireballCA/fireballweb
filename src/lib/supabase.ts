import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

const REMEMBER_DEVICE_KEY = 'fireball-remember-device'

const memoryStore: Record<string, string> = {}

function usePersistentStorage(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(REMEMBER_DEVICE_KEY) !== '0'
}

const authStorage = {
  getItem(key: string): string | null {
    return usePersistentStorage() ? (typeof window !== 'undefined' ? window.localStorage.getItem(key) : null) : (memoryStore[key] ?? null)
  },
  setItem(key: string, value: string): void {
    if (usePersistentStorage()) {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
    } else {
      memoryStore[key] = value
    }
  },
  removeItem(key: string): void {
    if (usePersistentStorage()) {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key)
    } else {
      delete memoryStore[key]
    }
  },
}

/** À appeler avant signIn/signUp : si false, la session ne sera pas persistée (déconnexion à la fermeture de l’onglet). */
export function setRememberDevice(remember: boolean) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(REMEMBER_DEVICE_KEY, remember ? '1' : '0')
  }
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase URL or Anon Key is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
  )
}

// createClient throws if url is empty — use a harmless placeholder so the SPA can still boot locally.
const clientUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co'
const clientKey = isSupabaseConfigured ? supabaseAnonKey : 'public-anon-key'

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    storage: authStorage,
    autoRefreshToken: isSupabaseConfigured,
  },
})
