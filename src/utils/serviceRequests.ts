import { supabase } from '@/lib/supabase'

export const SERVICE_REQUEST_PHOTOS_BUCKET = 'service-request-images'

export type ServiceRequestSource = 'service_builder' | 'quick_service_map'

export type ServiceRequestInsertPayload = {
  source: ServiceRequestSource
  stockistId?: string | null
  stockistSnapshot?: string | null
  reference: string
  userId?: string | null
  vehicleSize: string
  paintCondition: string
  coatingId: string
  coatingName: string
  waxId?: string | null
  waxName?: string | null
  estimateCad: number
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  serviceAddress: string
  customMessage?: string | null
  photoManifest?: string | null
}

export type ServiceRequestRow = {
  id: string
  created_at: string
  updated_at: string
  source: ServiceRequestSource
  stockist_id: string | null
  stockist_snapshot: string | null
  reference: string
  user_id: string | null
  vehicle_size: string
  paint_condition: string
  coating_id: string
  coating_name: string
  wax_id: string | null
  wax_name: string | null
  estimate_cad: number
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  contact_first_name: string
  contact_last_name: string
  contact_email: string
  contact_phone: string
  service_address: string
  custom_message: string | null
  photo_manifest: string | null
  shared_with_partners: boolean
  shared_with_partners_at: string | null
}

/** Entrées séparées par des virgules : chemins `FB-SRV-…/fichier` (nouveau) ou simples noms (ancien). */
export function parseServiceRequestPhotoManifest(manifest: string | null | undefined): string[] {
  if (!manifest?.trim()) return []
  return manifest
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isServiceRequestStoragePhotoPath(entry: string): boolean {
  return /^FB-SRV-\d{4}-\d{6}\/.+$/i.test(entry.trim())
}

function sanitizeUploadFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_')
  return (base || 'photo').slice(0, 120)
}

/** Upload les fichiers sous `{reference}/{index}_{nom}` ; retourne les chemins stockés dans le bucket. */
export async function uploadServiceRequestVehiclePhotos(
  reference: string,
  files: File[],
): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  if (files.length === 0) return { ok: true, paths: [] }
  const maxBytes = 10 * 1024 * 1024
  const paths: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    if (file.size > maxBytes) {
      return { ok: false, error: `File too large (max 10 MB): ${file.name}` }
    }
    const path = `${reference}/${i}_${sanitizeUploadFileName(file.name)}`
    const { error } = await supabase.storage.from(SERVICE_REQUEST_PHOTOS_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })
    if (error) {
      if (paths.length > 0) {
        await supabase.storage.from(SERVICE_REQUEST_PHOTOS_BUCKET).remove(paths)
      }
      return { ok: false, error: error.message || 'Upload failed' }
    }
    paths.push(path)
  }
  return { ok: true, paths }
}

export async function createSignedUrlsForServiceRequestPhotos(
  paths: string[],
  expiresInSec = 60 * 60 * 24 * 7,
): Promise<{ path: string; signedUrl: string }[]> {
  const out: { path: string; signedUrl: string }[] = []
  for (const path of paths) {
    if (!isServiceRequestStoragePhotoPath(path)) continue
    const { data, error } = await supabase.storage
      .from(SERVICE_REQUEST_PHOTOS_BUCKET)
      .createSignedUrl(path, expiresInSec)
    if (!error && data?.signedUrl) out.push({ path, signedUrl: data.signedUrl })
  }
  return out
}

export async function insertServiceRequest(
  payload: ServiceRequestInsertPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('service_requests').insert({
    source: payload.source,
    stockist_id: payload.stockistId ?? null,
    stockist_snapshot: payload.stockistSnapshot ?? null,
    reference: payload.reference,
    user_id: payload.userId ?? null,
    vehicle_size: payload.vehicleSize,
    paint_condition: payload.paintCondition,
    coating_id: payload.coatingId,
    coating_name: payload.coatingName,
    wax_id: payload.waxId ?? null,
    wax_name: payload.waxName ?? null,
    estimate_cad: payload.estimateCad,
    vehicle_make: payload.vehicleMake,
    vehicle_model: payload.vehicleModel,
    vehicle_year: payload.vehicleYear,
    contact_first_name: payload.contactFirstName,
    contact_last_name: payload.contactLastName,
    contact_email: payload.contactEmail,
    contact_phone: payload.contactPhone,
    service_address: payload.serviceAddress,
    custom_message: payload.customMessage ?? null,
    photo_manifest: payload.photoManifest ?? null,
  })
  if (error) {
    console.error('insertServiceRequest', error)
    return { ok: false, error: error.message || 'Save failed' }
  }
  return { ok: true }
}

export async function fetchServiceRequestsForAdmin(): Promise<ServiceRequestRow[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) {
    console.error('fetchServiceRequestsForAdmin', error)
    return []
  }
  return (data ?? []) as ServiceRequestRow[]
}

export async function markServiceRequestSharedWithPartners(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('service_requests')
    .update({
      shared_with_partners: true,
      shared_with_partners_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) {
    console.error('markServiceRequestSharedWithPartners', error)
    return false
  }
  return true
}

export function buildPartnerShareText(row: ServiceRequestRow): string {
  const lines = [
    `Fireball service request ${row.reference}`,
    `Source: ${row.source === 'quick_service_map' ? 'Quick service (map)' : 'Service Builder'}`,
    row.stockist_snapshot ? `Shop: ${row.stockist_snapshot}` : null,
    `Vehicle: ${row.vehicle_year} ${row.vehicle_make} ${row.vehicle_model} (${row.vehicle_size}, ${row.paint_condition})`,
    `Coating: ${row.coating_name}${row.wax_name ? ` + ${row.wax_name}` : ''}`,
    `Estimate: $${Number(row.estimate_cad).toFixed(0)} CAD`,
    `Service / customer location: ${row.service_address}`,
    `Contact: ${row.contact_first_name} ${row.contact_last_name} · ${row.contact_email} · ${row.contact_phone}`,
    row.custom_message ? `Notes: ${row.custom_message}` : null,
  ]
  return lines.filter(Boolean).join('\n')
}
