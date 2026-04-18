import { supabase } from '@/lib/supabase'

export type TrainingRequestStatus =
  | 'pending'
  | 'approved'
  | 'payment_pending'
  | 'paid'
  | 'declined'
  | 'cancelled'

export type TrainingRequestRow = {
  id: string
  user_id: string
  reference: string
  session_id: string | null
  session_label: string
  status: TrainingRequestStatus
  applicant_message: string | null
  phone: string | null
  admin_note?: string | null
  payment_instructions?: string | null
  created_at: string
  updated_at: string
}

export type TrainingRequestWithProfile = TrainingRequestRow & {
  profile_email: string | null
  profile_first_name: string | null
  profile_last_name: string | null
}

const ALLOWED_TRAINING_STATUS: TrainingRequestStatus[] = [
  'pending',
  'approved',
  'payment_pending',
  'paid',
  'declined',
  'cancelled',
]

/** Normalise le statut renvoyé par PostgREST (espaces, casse). */
export function normalizeTrainingStatus(raw: unknown): TrainingRequestStatus {
  const v = String(raw ?? '')
    .trim()
    .toLowerCase()
  return (ALLOWED_TRAINING_STATUS.includes(v as TrainingRequestStatus) ? v : 'pending') as TrainingRequestStatus
}

function mapTrainingRow(row: Record<string, unknown>): TrainingRequestRow {
  return {
    ...(row as TrainingRequestRow),
    status: normalizeTrainingStatus(row.status),
  }
}

export async function insertTrainingRequest(params: {
  userId: string
  reference: string
  sessionId: string | null
  sessionLabel: string
  message: string
  phone: string
}): Promise<{ ok: true; row: TrainingRequestRow } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('training_requests')
    .insert({
      user_id: params.userId,
      reference: params.reference,
      session_id: params.sessionId,
      session_label: params.sessionLabel,
      status: 'pending',
      applicant_message: params.message,
      phone: params.phone,
    })
    .select()
    .single()

  if (error) {
    return { ok: false, error: error.message || 'Unable to save training request.' }
  }
  return { ok: true, row: mapTrainingRow(data as Record<string, unknown>) }
}

/** Demandes pour le dashboard membre. */
export async function fetchTrainingRequestsForDashboard(userId: string): Promise<TrainingRequestRow[]> {
  const { data, error } = await supabase
    .from('training_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.warn('training_requests fetch:', error.message)
    return []
  }
  return (data || []).map((row) => mapTrainingRow(row as Record<string, unknown>))
}

/** Priorité pour la carte dashboard quand plusieurs demandes existent (la plus avancée d’abord). */
const DASHBOARD_STATUS_PRIORITY: Record<TrainingRequestStatus, number> = {
  paid: 60,
  payment_pending: 50,
  approved: 40,
  pending: 30,
  declined: 20,
  cancelled: 10,
}

/** Choisit la demande à mettre en avant (badge, timeline, CTA paiement). */
export function pickPrimaryTrainingRequestForDashboard(rows: TrainingRequestRow[]): TrainingRequestRow | null {
  if (!rows.length) return null
  return [...rows].sort((a, b) => {
    const diff = DASHBOARD_STATUS_PRIORITY[b.status] - DASHBOARD_STATUS_PRIORITY[a.status]
    if (diff !== 0) return diff
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })[0]
}

/** Toutes les demandes (admin) — nécessite policy RLS admin. */
export async function fetchAllTrainingRequestsForAdmin(): Promise<TrainingRequestWithProfile[]> {
  const { data: rows, error } = await supabase
    .from('training_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('training_requests admin fetch:', error.message)
    return []
  }

  const list = (rows || []).map((row) => mapTrainingRow(row as Record<string, unknown>))
  const userIds = [...new Set(list.map((r) => r.user_id))]
  if (userIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name')
    .in('id', userIds)

  const byId = new Map((profiles || []).map((p: any) => [p.id as string, p]))

  return list.map((r) => {
    const p = byId.get(r.user_id) as { email?: string; first_name?: string; last_name?: string } | undefined
    return {
      ...r,
      profile_email: p?.email ?? null,
      profile_first_name: p?.first_name ?? null,
      profile_last_name: p?.last_name ?? null,
    }
  })
}

export async function updateTrainingRequestAdmin(
  id: string,
  patch: Partial<Pick<TrainingRequestRow, 'status' | 'admin_note' | 'payment_instructions' | 'updated_at'>>,
): Promise<{ ok: true; row: TrainingRequestRow } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('training_requests')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id,user_id,reference,session_id,session_label,status,applicant_message,phone,admin_note,payment_instructions,created_at,updated_at')
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message || 'Update failed.' }
  }
  if (!data) {
    return {
      ok: false,
      error:
        'Aucune ligne mise à jour. Vérifiez que votre compte a le rôle admin dans profiles et que les politiques RLS training_requests_update_admin sont appliquées.',
    }
  }
  return { ok: true, row: mapTrainingRow(data as Record<string, unknown>) }
}
