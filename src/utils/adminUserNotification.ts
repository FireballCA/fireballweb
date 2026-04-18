import { supabase } from '@/lib/supabase'

/** Notification ciblée pour un utilisateur (dashboard + liste). */
export async function insertUserTargetedNotification(params: {
  userId: string
  title: string
  message: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: 'Not authenticated.' }
  }

  const { error } = await supabase.from('user_notifications').insert({
    title: params.title.trim() || null,
    message: params.message.trim(),
    target_type: 'user',
    target_role: null,
    target_user_id: params.userId,
    created_by: user.id,
  })

  if (error) {
    return { ok: false, error: error.message || 'Unable to create notification.' }
  }
  return { ok: true }
}
