import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

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

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: authStorage,
  },
})
