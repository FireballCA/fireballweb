import { supabase } from '@/lib/supabase'

export const XP_PER_DOLLAR = 5

export type XpEvent =
  | { type: 'order'; amount: number }
  | { type: 'training'; amount: number }
  | { type: 'membership'; level: 'ignition' | 'apex'; amount: number }

function computeXp(event: XpEvent): number {
  const baseXp = Math.max(0, Math.round(event.amount * XP_PER_DOLLAR))
  let bonus = 0

  if (event.type === 'training') {
    bonus += 300
  }
  if (event.type === 'membership' && event.level === 'ignition') {
    bonus += 200
  }
  if (event.type === 'membership' && event.level === 'apex') {
    bonus += 800
  }

  return baseXp + bonus
}

export async function awardXp(
  event: XpEvent,
): Promise<{ success: boolean; awardedXp?: number; newTotalXp?: number; error?: string }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || 'Utilisateur non connecté' }
    }

    const awardedXp = computeXp(event)
    if (awardedXp <= 0) {
      return { success: true, awardedXp: 0, newTotalXp: undefined }
    }

    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .maybeSingle()

    if (selectError) {
      console.error('Error fetching profile xp:', selectError)
      return { success: false, error: selectError.message }
    }

    const currentXp = typeof profile?.xp === 'number' ? profile.xp : 0
    const newTotalXp = currentXp + awardedXp

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newTotalXp })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile xp:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, awardedXp, newTotalXp }
  } catch (error) {
    console.error('Unexpected error awarding XP:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

interface AdminAdjustXpResult {
  success: boolean
  error?: string
  previousXp?: number
  newXp?: number
  profileLabel?: string
}

/**
 * Outil admin : ajuster l'XP d'un membre via son email ou son Member ID externe.
 * Utilisé dans la console ManagePartners > Global stats.
 */
export async function adminAdjustXpByIdentifier(params: {
  identifier: string
  deltaXp: number
}): Promise<AdminAdjustXpResult> {
  const identifier = params.identifier.trim()
  if (!identifier) {
    return { success: false, error: 'Identifiant manquant.' }
  }

  if (!Number.isFinite(params.deltaXp) || params.deltaXp === 0) {
    return { success: false, error: 'Delta XP invalide.' }
  }

  try {
    // Vérifier qu'un utilisateur est connecté (politiques Supabase gèrent le rôle admin)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: userError?.message || 'Session invalide.' }
    }

    // 1) Essayer par email
    type ProfileRow = {
      id: string
      xp: number | null
      first_name: string | null
      last_name: string | null
      email: string | null
      external_member_id: string | null
    }

    let selectError: Error | null = null
    let profile: ProfileRow | null = null

    const first = await supabase
      .from('profiles')
      .select('id,xp,first_name,last_name,email,external_member_id')
      .eq('email', identifier)
      .maybeSingle()

    if (first.error) {
      selectError = first.error
    } else if (first.data) {
      profile = first.data as ProfileRow
    } else {
      // 2) Sinon, essayer par external_member_id
      const second = await supabase
        .from('profiles')
        .select('id,xp,first_name,last_name,email,external_member_id')
        .eq('external_member_id', identifier)
        .maybeSingle()

      if (second.error) {
        selectError = second.error
      } else if (second.data) {
        profile = second.data as ProfileRow
      }
    }

    if (selectError) {
      console.error('Error fetching profile for admin XP adjust:', selectError)
      return { success: false, error: selectError.message }
    }

    if (!profile) {
      return { success: false, error: "Aucun profil trouvé pour cet identifiant." }
    }

    const previousXp = typeof profile.xp === 'number' ? profile.xp : 0
    const tentativeNewXp = previousXp + params.deltaXp
    const newXp = Math.max(0, tentativeNewXp)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Error updating profile xp (admin):', updateError)
      return { success: false, error: updateError.message }
    }

    const profileLabel =
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.email ||
      profile.external_member_id ||
      profile.id

    return {
      success: true,
      previousXp,
      newXp,
      profileLabel,
    }
  } catch (error) {
    console.error('Unexpected error in adminAdjustXpByIdentifier:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

