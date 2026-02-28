-- Execute in Supabase SQL Editor
-- Creates the partner application/company table linked to profiles.

create table if not exists public.partner_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  notes text,
  application_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_companies_status_check check (status in ('pending', 'partner', 'declined'))
);

alter table public.partner_companies
add column if not exists application_data jsonb not null default '{}'::jsonb;

alter table public.partner_companies
add column if not exists certification_level text not null default 'standard';

alter table public.partner_companies
add column if not exists total_installations integer not null default 0;

alter table public.partner_companies
add column if not exists total_clients integer not null default 0;

alter table public.partner_companies
add column if not exists warranty_registrations integer not null default 0;

alter table public.partner_companies
add column if not exists partner_activity_status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_companies_certification_level_check'
  ) then
    alter table public.partner_companies
    add constraint partner_companies_certification_level_check
    check (certification_level in ('standard', 'advanced', 'elite'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_companies_activity_status_check'
  ) then
    alter table public.partner_companies
    add constraint partner_companies_activity_status_check
    check (partner_activity_status in ('active', 'suspended'));
  end if;
end $$;

create unique index if not exists partner_companies_user_id_key
  on public.partner_companies (user_id);

create index if not exists partner_companies_status_idx
  on public.partner_companies (status);
