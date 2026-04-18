-- Demandes de formation Academy (soumission client, revue par l'équipe Fireball Canada)
-- À exécuter dans le SQL Editor Supabase après revue.

CREATE TABLE IF NOT EXISTS public.training_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reference text NOT NULL,
  session_id text,
  session_label text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'payment_pending', 'paid', 'declined', 'cancelled')),
  applicant_message text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  admin_note text,
  payment_instructions text
);

CREATE UNIQUE INDEX IF NOT EXISTS training_requests_reference_key ON public.training_requests (reference);
CREATE INDEX IF NOT EXISTS training_requests_user_id_created_at_idx ON public.training_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS training_requests_user_status_idx ON public.training_requests (user_id, status);

ALTER TABLE public.training_requests ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement ses propres demandes
CREATE POLICY "training_requests_select_own"
  ON public.training_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Insertion : uniquement pour soi-même
CREATE POLICY "training_requests_insert_own"
  ON public.training_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Pas de mise à jour / suppression côté client (réservé admin / service role)

COMMENT ON TABLE public.training_requests IS 'Demandes de formation Academy ; statut mis à jour par Fireball Canada.';
