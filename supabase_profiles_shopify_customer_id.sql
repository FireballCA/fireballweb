-- =============================================================================
-- À exécuter dans le Supabase SQL Editor si la colonne n'existe pas encore.
-- Stocke l'ID client Shopify (GID) pour les commandes et la synchro.
-- =============================================================================
alter table public.profiles
  add column if not exists shopify_customer_id text;

comment on column public.profiles.shopify_customer_id is
  'Shopify Storefront API customer GID (e.g. gid://shopify/Customer/123) for orders and sync';
