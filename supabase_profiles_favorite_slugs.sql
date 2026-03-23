-- Favoris produits (slugs) stockés sur le profil utilisateur
alter table public.profiles
  add column if not exists favorite_product_slugs jsonb default '[]'::jsonb;

comment on column public.profiles.favorite_product_slugs is
  'Liste des slugs produits favoris (JSON array de strings).';
