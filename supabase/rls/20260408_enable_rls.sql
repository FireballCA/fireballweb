-- Activer RLS pour les tables sensibles
alter table if exists public.user_notifications enable row level security;
alter table if exists public.purchases enable row level security;
alter table if exists public.partner_companies enable row level security;

-- user_notifications: structure attendue par l'app:
-- - notifications 'all' (publiques)
-- - notifications 'role' (par rôle; à affiner selon votre modèle)
-- - notifications 'user' (ciblées: colonne target_user_id)
drop policy if exists "user_notifications_select_all" on public.user_notifications;
create policy "user_notifications_select_all"
on public.user_notifications
for select
to anon, authenticated
using (target_type = 'all');

drop policy if exists "user_notifications_select_by_role" on public.user_notifications;
create policy "user_notifications_select_by_role"
on public.user_notifications
for select
to authenticated
using (target_type = 'role');
-- NOTE: Idéalement, restreindre par rôle de l'utilisateur si disponible dans votre schéma/JWT.

drop policy if exists "user_notifications_select_own_user" on public.user_notifications;
create policy "user_notifications_select_own_user"
on public.user_notifications
for select
to authenticated
using (target_type = 'user' and target_user_id = auth.uid());

drop policy if exists "user_notifications_insert_authenticated" on public.user_notifications;
create policy "user_notifications_insert_authenticated"
on public.user_notifications
for insert
to authenticated
with check (true);

-- purchases: un utilisateur peut lire ses achats; insertion restreinte à l'utilisateur courant
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
on public.purchases
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own"
on public.purchases
for insert
to authenticated
with check (user_id = auth.uid());

-- partner_companies: lecture publique (si nécessaire), écriture réservée aux utilisateurs authentifiés (à adapter si rôle admin)
drop policy if exists "partner_companies_public_read" on public.partner_companies;
create policy "partner_companies_public_read"
on public.partner_companies
for select
to anon, authenticated
using (true);

drop policy if exists "partner_companies_write_authenticated" on public.partner_companies;
create policy "partner_companies_write_authenticated"
on public.partner_companies
for all
to authenticated
using (true)
with check (true);

-- NOTE: Adaptez les politiques ci-dessus selon votre modèle d'autorisations réel.

