/**
 * _auth.js — Helper d'authentification partagé pour les endpoints API
 * Utilise Supabase service-role pour vérifier les tokens JWT clients.
 */
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * Extrait et vérifie le Bearer token depuis les headers.
 * Retourne { user } si valide, ou { error, status } sinon.
 */
export async function requireAuth(req) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { error: 'Server misconfigured', status: 500 }

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return { error: 'Unauthorized', status: 401 }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return { error: 'Unauthorized', status: 401 }

  return { user: data.user, supabase }
}

/**
 * Vérifie auth + role admin.
 * Retourne { user, profile } si admin, ou { error, status } sinon.
 */
export async function requireAdminAuth(req) {
  const result = await requireAuth(req)
  if (result.error) return result

  const { data: profile, error: profileError } = await result.supabase
    .from('profiles')
    .select('role, partner_status')
    .eq('id', result.user.id)
    .maybeSingle()

  if (profileError || !profile) return { error: 'Forbidden', status: 403 }

  const role = String(profile.role || '').toLowerCase()
  if (role !== 'admin') return { error: 'Forbidden', status: 403 }

  return { user: result.user, profile, supabase: result.supabase }
}

/**
 * Vérifie auth + role admin ou partner.
 */
export async function requirePartnerOrAdminAuth(req) {
  const result = await requireAuth(req)
  if (result.error) return result

  const { data: profile, error: profileError } = await result.supabase
    .from('profiles')
    .select('role, partner_status')
    .eq('id', result.user.id)
    .maybeSingle()

  if (profileError || !profile) return { error: 'Forbidden', status: 403 }

  const role = String(profile.role || '').toLowerCase()
  const partnerStatus = String(profile.partner_status || '').toLowerCase()
  const allowed = role === 'admin' || role === 'partner' || partnerStatus === 'partner'
  if (!allowed) return { error: 'Forbidden', status: 403 }

  return { user: result.user, profile, supabase: result.supabase }
}
