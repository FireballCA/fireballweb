-- Run in Supabase SQL Editor
-- Allows certified partners to look up a Fireball member profile by email (for "Find their account" in Add Client).
-- RLS on profiles normally blocks reading other users' rows; this function runs with definer rights and only
-- returns one profile when the caller is a partner, so partners can link existing Fireball accounts to their client list.

create or replace function public.get_profile_by_email_for_partner(email_input text)
returns table (id uuid, first_name text, last_name text, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if email_input is null or trim(email_input) = '' then
    return;
  end if;
  -- Only allow if the current user is a certified partner
  if not exists (
    select 1 from public.partner_companies pc
    where pc.user_id = auth.uid() and pc.status = 'partner'
  ) then
    return;
  end if;
  return query
  select p.id, p.first_name, p.last_name, p.email
  from public.profiles p
  where lower(trim(p.email)) = lower(trim(email_input))
  limit 1;
end;
$$;

comment on function public.get_profile_by_email_for_partner(text) is
  'Allows partners to look up a profile by email when adding a client. Returns at most one row.';

grant execute on function public.get_profile_by_email_for_partner(text) to authenticated;
grant execute on function public.get_profile_by_email_for_partner(text) to service_role;
