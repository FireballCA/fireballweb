-- Permet à un utilisateur de supprimer ses notifications personnelles (target user).
-- Les lignes « all » / « role » restent en base ; l’app les masque via localStorage (dismissed ids).
drop policy if exists "user_notifications_delete_own_user" on public.user_notifications;
create policy "user_notifications_delete_own_user"
on public.user_notifications
for delete
to authenticated
using (target_type = 'user' and target_user_id = auth.uid());
