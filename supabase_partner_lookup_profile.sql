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

-- Search profiles by email (partial match) for suggestions as the partner types. Returns up to 8 matches.
create or replace function public.search_profiles_by_email_for_partner(email_input text)
returns table (id uuid, first_name text, last_name text, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if email_input is null or length(trim(email_input)) < 2 then
    return;
  end if;
  if not exists (
    select 1 from public.partner_companies pc
    where pc.user_id = auth.uid() and pc.status = 'partner'
  ) then
    return;
  end if;
  return query
  select p.id, p.first_name, p.last_name, p.email
  from public.profiles p
  where p.email is not null and trim(p.email) <> ''
    and lower(p.email) like '%' || lower(trim(email_input)) || '%'
  order by case when lower(p.email) = lower(trim(email_input)) then 0 else 1 end,
           length(p.email)
  limit 8;
end;
$$;

comment on function public.search_profiles_by_email_for_partner(text) is
  'Partners: search profiles by email (partial match) for autocomplete. Min 2 characters.';

grant execute on function public.search_profiles_by_email_for_partner(text) to authenticated;
grant execute on function public.search_profiles_by_email_for_partner(text) to service_role;

-- Returns vehicles from the member's Fireball garage (garage_vehicles) so partners can see them when linking an account.
-- profile_id = profiles.id (same as auth.uid() for that user; garage_vehicles.user_id references that).
create or replace function public.get_garage_vehicles_for_partner(profile_id uuid)
returns table (id uuid, brand text, model text, year integer, color text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if profile_id is null then
    return;
  end if;
  if not exists (
    select 1 from public.partner_companies pc
    where pc.user_id = auth.uid() and pc.status = 'partner'
  ) then
    return;
  end if;
  return query
  select gv.id, gv.brand, gv.model, gv.year, null::text as color
  from public.garage_vehicles gv
  where gv.user_id = profile_id;
end;
$$;

comment on function public.get_garage_vehicles_for_partner(uuid) is
  'Partners: list vehicles from a member garage (when looking up account by email).';

grant execute on function public.get_garage_vehicles_for_partner(uuid) to authenticated;
grant execute on function public.get_garage_vehicles_for_partner(uuid) to service_role;
