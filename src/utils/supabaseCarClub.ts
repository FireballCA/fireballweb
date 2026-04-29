import { supabase } from '@/lib/supabase'

export interface CarClubSettings {
  ignition_price: string
  ignition_features: string[]
  apex_price: string
  apex_features: string[]
}

const KEY = 'car_club'

export async function fetchCarClubSettings(): Promise<CarClubSettings | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', KEY)
    .maybeSingle()
  return (data?.value as CarClubSettings) ?? null
}

export async function saveCarClubSettings(settings: CarClubSettings): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('site_settings')
    .select('id')
    .eq('key', KEY)
    .maybeSingle()

  const payload = { value: settings, updated_at: new Date().toISOString() }
  const query = existing
    ? supabase.from('site_settings').update(payload).eq('key', KEY)
    : supabase.from('site_settings').insert({ key: KEY, ...payload })

  const { error } = await query
  return { error: error ? error.message : null }
}

export function subscribeCarClubSettings(cb: (settings: CarClubSettings) => void) {
  return supabase
    .channel('car_club_settings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'site_settings', filter: `key=eq.${KEY}` },
      (payload) => {
        const value = (payload.new as { value?: CarClubSettings })?.value
        if (value) cb(value)
      },
    )
    .subscribe()
}
