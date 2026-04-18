-- Workflow admin : formations + partenaires (paiement, etc.)
-- Exécuter dans Supabase SQL Editor si les migrations auto ne sont pas utilisées.

-- ── training_requests : statuts étendus + notes
ALTER TABLE public.training_requests DROP CONSTRAINT IF EXISTS training_requests_status_check;
ALTER TABLE public.training_requests ADD CONSTRAINT training_requests_status_check
  CHECK (status IN (
    'pending',
    'approved',
    'payment_pending',
    'paid',
    'declined',
    'cancelled'
  ));

ALTER TABLE public.training_requests ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.training_requests ADD COLUMN IF NOT EXISTS payment_instructions text;

-- ── partner_companies : étape paiement avant activation
ALTER TABLE public.partner_companies DROP CONSTRAINT IF EXISTS partner_companies_status_check;
ALTER TABLE public.partner_companies ADD CONSTRAINT partner_companies_status_check
  CHECK (status IN ('pending', 'payment_pending', 'partner', 'declined'));

-- ── RLS : admins lisent / mettent à jour toutes les demandes de formation
DROP POLICY IF EXISTS "training_requests_select_admin" ON public.training_requests;
CREATE POLICY "training_requests_select_admin"
  ON public.training_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

DROP POLICY IF EXISTS "training_requests_update_admin" ON public.training_requests;
CREATE POLICY "training_requests_update_admin"
  ON public.training_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(trim(coalesce(p.role::text, ''))) = 'admin'
    )
  );

COMMENT ON COLUMN public.training_requests.payment_instructions IS 'Instructions de paiement envoyées au membre (ex. après approbation).';
COMMENT ON COLUMN public.training_requests.admin_note IS 'Note interne admin (non affichée au client).';
