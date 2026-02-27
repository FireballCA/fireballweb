import { supabase } from '@/lib/supabase'

export interface GarageVehicleRow {
  id: string
  user_id: string
  brand: string
  model: string
  year: number
  ceramic_protection_date: string
  protection_shop?: string | null
  protection_product?: string | null
  created_at: string
}

export async function fetchGarageVehicles(): Promise<GarageVehicleRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('garage_vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching garage vehicles:', error)
    return []
  }

  return (data || []) as GarageVehicleRow[]
}

export async function createGarageVehicle(input: {
  brand: string
  model: string
  year: number
  ceramicProtectionDate: Date
  protectionShop?: string
}): Promise<GarageVehicleRow | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const payload: Record<string, unknown> = {
    user_id: user.id,
    brand: input.brand,
    model: input.model,
    year: input.year,
    ceramic_protection_date: input.ceramicProtectionDate.toISOString(),
  }
  if (input.protectionShop && input.protectionShop.trim()) {
    payload.protection_shop = input.protectionShop.trim()
  }

  const { data, error } = await supabase
    .from('garage_vehicles')
    .insert(payload)
    .select('*')
    .maybeSingle()

  if (error || !data) {
    console.error('Error creating garage vehicle:', error)
    return null
  }

  return data as GarageVehicleRow
}

export async function updateGarageVehicle(id: string, input: {
  brand?: string
  model?: string
  year?: number
  ceramicProtectionDate?: Date
  protectionShop?: string
}): Promise<GarageVehicleRow | null> {
  const payload: Record<string, unknown> = {}
  if (input.brand !== undefined) payload.brand = input.brand
  if (input.model !== undefined) payload.model = input.model
  if (input.year !== undefined) payload.year = input.year
  if (input.ceramicProtectionDate) {
    payload.ceramic_protection_date = input.ceramicProtectionDate.toISOString()
  }
  if (input.protectionShop !== undefined) {
    payload.protection_shop = input.protectionShop.trim()
  }

  const { data, error } = await supabase
    .from('garage_vehicles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error || !data) {
    console.error('Error updating garage vehicle:', error)
    return null
  }

  return data as GarageVehicleRow
}

export async function deleteGarageVehicle(id: string): Promise<boolean> {
  const { error } = await supabase.from('garage_vehicles').delete().eq('id', id)
  if (error) {
    console.error('Error deleting garage vehicle:', error)
    return false
  }
  return true
}

