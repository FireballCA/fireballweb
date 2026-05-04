-- Bucket prive service-request-images : upload anon/auth (chemins FB-SRV-AAAA-NNNNNN/fichier), lecture admin.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-request-images',
  'service-request-images',
  false,
  10485760,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "service_request_images_insert_public" ON storage.objects;
CREATE POLICY "service_request_images_insert_public"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'service-request-images'
    AND name ~ '^FB-SRV-[0-9]{4}-[0-9]{6}/[^/]+$'
  );

DROP POLICY IF EXISTS "service_request_images_select_admin" ON storage.objects;
CREATE POLICY "service_request_images_select_admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'service-request-images'
    AND public.is_current_user_admin()
  );

DROP POLICY IF EXISTS "service_request_images_delete_admin" ON storage.objects;
CREATE POLICY "service_request_images_delete_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'service-request-images'
    AND public.is_current_user_admin()
  );
