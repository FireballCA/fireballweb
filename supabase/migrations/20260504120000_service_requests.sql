-- Demandes Service Builder / Quick service (carte). Lecture et mise à jour réservées aux admins.

CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('service_builder', 'quick_service_map')),
  stockist_id text,
  stockist_snapshot text,
  reference text NOT NULL,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  vehicle_size text NOT NULL,
  paint_condition text NOT NULL,
  coating_id text NOT NULL,
  coating_name text NOT NULL,
  wax_id text,
  wax_name text,
  estimate_cad numeric NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year text NOT NULL,
  contact_first_name text NOT NULL,
  contact_last_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  service_address text NOT NULL,
  custom_message text,
  photo_manifest text,
  shared_with_partners boolean NOT NULL DEFAULT false,
  shared_with_partners_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS service_requests_reference_key ON public.service_requests (reference);
CREATE INDEX IF NOT EXISTS service_requests_created_at_idx ON public.service_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS service_requests_source_idx ON public.service_requests (source);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_requests_insert_public" ON public.service_requests;
CREATE POLICY "service_requests_insert_public"
  ON public.service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_requests_select_admin" ON public.service_requests;
CREATE POLICY "service_requests_select_admin"
  ON public.service_requests
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "service_requests_update_admin" ON public.service_requests;
CREATE POLICY "service_requests_update_admin"
  ON public.service_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

GRANT INSERT ON public.service_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.service_requests TO authenticated;

COMMENT ON TABLE public.service_requests IS 'Demandes configurateur service (site) et quick service depuis la carte installateurs.';
