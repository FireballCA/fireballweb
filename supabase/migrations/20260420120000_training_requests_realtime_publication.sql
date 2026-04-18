-- Permet à Realtime (postgres_changes) de diffuser les changements sur training_requests (dashboard membre).
-- Sans ceci, le client peut rester sur d’anciens statuts jusqu’à un refocus / refetch manuel.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'training_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_requests;
  END IF;
END $$;
