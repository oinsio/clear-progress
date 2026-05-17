-- implements FR10, FR11 of add-supabase-integration-tests
-- Storage bucket and RLS policy — runs AFTER storage-api has created its schema tables.

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', FALSE)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'covers_storage_user_isolation'
      AND tablename = 'objects'
      AND schemaname = 'storage'
  ) THEN
    CREATE POLICY covers_storage_user_isolation ON storage.objects
      FOR ALL TO authenticated
      USING (
        bucket_id = 'covers'
        AND (storage.foldername(name))[2] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'covers'
        AND (storage.foldername(name))[2] = auth.uid()::text
      );
  END IF;
END $$;
