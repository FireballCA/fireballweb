-- Fix RLS admin checks for training_requests.
-- Problem: policy expressions that query public.profiles can fail under RLS on profiles,
-- causing UPDATE to silently affect 0 rows even when the user is admin in the app UI.

-- 1) Centralize admin check in a SECURITY DEFINER function.
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(trim(coalesce(p.role::text, ''))) = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- 2) Recreate admin policies using the function above.
DROP POLICY IF EXISTS "training_requests_select_admin" ON public.training_requests;
CREATE POLICY "training_requests_select_admin"
  ON public.training_requests
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "training_requests_update_admin" ON public.training_requests;
CREATE POLICY "training_requests_update_admin"
  ON public.training_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

