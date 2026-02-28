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

create unique index if not exists partner_companies_user_id_key
  on public.partner_companies (user_id);

create index if not exists partner_companies_status_idx
  on public.partner_companies (status);
