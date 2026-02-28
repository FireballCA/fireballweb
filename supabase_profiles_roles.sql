-- Execute this in Supabase SQL Editor
-- Adds user roles to profiles and keeps values constrained.

alter table public.profiles
add column if not exists role text;

alter table public.profiles
add column if not exists company_name text;

alter table public.profiles
add column if not exists partner_status text;

alter table public.profiles
alter column role set default 'member';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
    add constraint profiles_role_check
    check (role in ('member', 'partner', 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_partner_status_check'
  ) then
    alter table public.profiles
    add constraint profiles_partner_status_check
    check (partner_status in ('pending', 'partner', 'declined') or partner_status is null);
  end if;
end $$;

update public.profiles
set role = 'member'
where role is null;
