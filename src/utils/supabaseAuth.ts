import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
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
        return {
          id: user.id,
          first_name: firstName || fullName.split(' ')[0] || '',
          last_name: lastName || fullName.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString(),
        }
      }

      console.error('Error fetching user profile:', error)
      return null
    }

    return profile as UserProfile
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
