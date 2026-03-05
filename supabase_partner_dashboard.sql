-- Partner dashboard: extend partner_companies and add clients, vehicles, warranties.
-- Run in Supabase SQL Editor after supabase_partner_companies.sql.

-- Extend partner_companies with onboarding/business profile fields
alter table public.partner_companies
  add column if not exists company_logo text,
  add column if not exists company_address text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists description text;

-- Clients of the partner (end-customers). user_id = link to profiles when they have an account (for "My Garage").
create table if not exists public.partner_clients (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists partner_clients_partner_id_idx on public.partner_clients(partner_id);
create index if not exists partner_clients_user_id_idx on public.partner_clients(user_id);

-- Vehicles registered by the partner (belong to a client).
create table if not exists public.partner_vehicles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.partner_clients(id) on delete cascade,
  partner_id uuid not null references public.partner_companies(id) on delete cascade,
  brand text not null,
  model text not null,
  year integer not null,
  vin text,
  color text,
  created_at timestamptz not null default now()
);

create index if not exists partner_vehicles_partner_id_idx on public.partner_vehicles(partner_id);
create index if not exists partner_vehicles_client_id_idx on public.partner_vehicles(client_id);

-- Warranty registrations. When created, vehicle can be mirrored to client's garage (garage_vehicles) if client.user_id is set.
create table if not exists public.partner_warranties (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_companies(id) on delete cascade,
  client_id uuid not null references public.partner_clients(id) on delete cascade,
  vehicle_id uuid not null references public.partner_vehicles(id) on delete cascade,
  product_used text not null,
  installation_date date not null,
  warranty_length text,
  notes text,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists partner_warranties_partner_id_idx on public.partner_warranties(partner_id);

-- RLS: allow partner to manage only their own data (partner_companies row where user_id = auth.uid())
alter table public.partner_clients enable row level security;
alter table public.partner_vehicles enable row level security;
alter table public.partner_warranties enable row level security;

drop policy if exists partner_clients_select on public.partner_clients;
create policy partner_clients_select on public.partner_clients for select
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_clients.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_clients_insert on public.partner_clients;
create policy partner_clients_insert on public.partner_clients for insert
  with check (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_clients.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_clients_update on public.partner_clients;
create policy partner_clients_update on public.partner_clients for update
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_clients.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_clients_delete on public.partner_clients;
create policy partner_clients_delete on public.partner_clients for delete
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_clients.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_vehicles_select on public.partner_vehicles;
create policy partner_vehicles_select on public.partner_vehicles for select
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_vehicles.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_vehicles_insert on public.partner_vehicles;
create policy partner_vehicles_insert on public.partner_vehicles for insert
  with check (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_vehicles.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_vehicles_update on public.partner_vehicles;
create policy partner_vehicles_update on public.partner_vehicles for update
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_vehicles.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_vehicles_delete on public.partner_vehicles;
create policy partner_vehicles_delete on public.partner_vehicles for delete
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_vehicles.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_warranties_select on public.partner_warranties;
create policy partner_warranties_select on public.partner_warranties for select
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_warranties.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_warranties_insert on public.partner_warranties;
create policy partner_warranties_insert on public.partner_warranties for insert
  with check (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_warranties.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_warranties_update on public.partner_warranties;
create policy partner_warranties_update on public.partner_warranties for update
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_warranties.partner_id and pc.user_id = auth.uid()
    )
  );

drop policy if exists partner_warranties_delete on public.partner_warranties;
create policy partner_warranties_delete on public.partner_warranties for delete
  using (
    exists (
      select 1 from public.partner_companies pc
      where pc.id = partner_warranties.partner_id and pc.user_id = auth.uid()
    )
  );
