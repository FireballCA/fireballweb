import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  subscription_tier?: string | null
  role?: string | null
  company_name?: string | null
  partner_status?: string | null
  xp?: number | null
  external_member_id?: string | null
  barcode_value?: string | null
}

/**
 * Récupère le profil de l'utilisateur actuellement connecté depuis Supabase
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !profile) {
      // Fallback sur user_metadata si la table profiles est vide ou inaccessible (RLS/policy)
      const metadata = (user.user_metadata || {}) as Record<string, unknown>
      const firstName = String(metadata.first_name || '').trim()
      const lastName = String(metadata.last_name || '').trim()
      const fullName = String(metadata.full_name || '').trim()

      if (firstName || lastName || fullName || user.email) {
        const subscriptionTier = String(
          metadata.subscription_tier || (metadata as Record<string, unknown>).membership_tier || ''
        )
          .trim() || null
        const role = String(metadata.role || (metadata as Record<string, unknown>).user_role || '').trim() || null
        const companyName = String(metadata.company_name || '').trim() || null
        const partnerStatus = String(metadata.partner_status || '').trim() || null
        const rawXp = (metadata as Record<string, unknown>).xp
        const parsedXp =
          typeof rawXp === 'number'
            ? rawXp
            : Number.isNaN(Number.parseInt(String(rawXp ?? '0'), 10))
            ? 0
            : Number.parseInt(String(rawXp ?? '0'), 10)
        const externalMemberId = String(
          (metadata as Record<string, unknown>).external_member_id || ''
        ).trim() || null
        const barcodeValue = String((metadata as Record<string, unknown>).barcode_value || '').trim() || null

        return {
          id: user.id,
          first_name: firstName || fullName.split(' ')[0] || '',
          last_name: lastName || fullName.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString(),
          subscription_tier: subscriptionTier,
          role,
          company_name: companyName,
          partner_status: partnerStatus,
          xp: Number.isFinite(parsedXp) ? parsedXp : 0,
          external_member_id: externalMemberId,
          barcode_value: barcodeValue,
        }
      }

      console.error('Error fetching user profile:', error)
      return null
    }

    const mappedProfile = profile as UserProfile
    const { data: companyRow, error: companyError } = await supabase
      .from('partner_companies')
      .select('company_name,status')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (companyError) {
      // Do not break dashboard/profile rendering if partner_companies query fails.
      console.warn('Partner company lookup failed:', companyError.message)
      return mappedProfile
    }

    if (!companyRow) {
      return mappedProfile
    }

    return {
      ...mappedProfile,
      company_name: (companyRow.company_name as string | null) ?? null,
      partner_status: (companyRow.status as string | null) ?? null,
    }
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error)
    return null
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

/**
 * Déconnecte l'utilisateur
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}
