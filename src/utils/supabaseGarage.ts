import { supabase } from '@/lib/supabase'

export interface GarageVehicleRow {
  id: string
  user_id: string
  brand: string
  model: string
  year: number
  color?: string | null
  image_url?: string | null
  notes?: string | null
  ceramic_protection_date?: string | null
  protection_shop?: string | null
  protection_product?: string | null
  created_at: string
}

export async function fetchGarageVehicles(): Promise<GarageVehicleRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('garage_vehicles')
    .select('id, user_id, brand, model, year, color, notes, ceramic_protection_date, protection_shop, protection_product, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching garage vehicles:', error)
    return []
  }

  return (data || []) as GarageVehicleRow[]
}

export async function uploadGarageVehicleImage(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('garage-images')
    .upload(path, file, { upsert: true })

  if (error) {
    console.error('Error uploading vehicle image:', error)
    return null
  }

  const { data } = supabase.storage.from('garage-images').getPublicUrl(path)
  return data.publicUrl
}

export async function createGarageVehicle(input: {
  brand: string
  model: string
  year: number
  color?: string
  imageUrl?: string
  notes?: string
  ceramicProtectionDate?: Date
  protectionShop?: string
  protectionProduct?: string
}): Promise<GarageVehicleRow | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const payload: Record<string, unknown> = {
    user_id: user.id,
    brand: input.brand,
    model: input.model,
    year: input.year,
  }
  if (input.color?.trim()) payload.color = input.color.trim()
  if (input.imageUrl?.trim()) payload.image_url = input.imageUrl.trim()
  if (input.notes?.trim()) payload.notes = input.notes.trim()
  if (input.ceramicProtectionDate) payload.ceramic_protection_date = input.ceramicProtectionDate.toISOString()
  if (input.protectionShop?.trim()) payload.protection_shop = input.protectionShop.trim()
  if (input.protectionProduct?.trim()) payload.protection_product = input.protectionProduct.trim()

  const { data, error } = await supabase
    .from('garage_vehicles')
    .insert(payload)
    .select('id, user_id, brand, model, year, color, notes, ceramic_protection_date, protection_shop, protection_product, created_at')
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
  color?: string | null
  imageUrl?: string | null
  notes?: string | null
  ceramicProtectionDate?: Date | null
  protectionShop?: string | null
  protectionProduct?: string | null
}): Promise<GarageVehicleRow | null> {
  const payload: Record<string, unknown> = {}
  if (input.brand !== undefined) payload.brand = input.brand
  if (input.model !== undefined) payload.model = input.model
  if (input.year !== undefined) payload.year = input.year
  if (input.color !== undefined) payload.color = input.color?.trim() || null
  if (input.imageUrl !== undefined) payload.image_url = input.imageUrl || null
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null
  if (input.ceramicProtectionDate !== undefined) payload.ceramic_protection_date = input.ceramicProtectionDate?.toISOString() ?? null
  if (input.protectionShop !== undefined) payload.protection_shop = input.protectionShop?.trim() || null
  if (input.protectionProduct !== undefined) payload.protection_product = input.protectionProduct?.trim() || null

  const { data, error } = await supabase
    .from('garage_vehicles')
    .update(payload)
    .eq('id', id)
    .select('id, user_id, brand, model, year, color, notes, ceramic_protection_date, protection_shop, protection_product, created_at')
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
