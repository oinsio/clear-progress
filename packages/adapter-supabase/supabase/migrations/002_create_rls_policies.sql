-- implements FR8, FR10, FR11 of add-supabase-adapter
-- Row Level Security policies on all tables + Storage bucket

-- ─── Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_meta       ENABLE ROW LEVEL SECURITY;
ALTER TABLE covers          ENABLE ROW LEVEL SECURITY;

-- ─── Entity table policies ───────────────────────────────────────────────────
-- Each user can only read/write rows where user_id = auth.uid()

CREATE POLICY tasks_user_isolation ON tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY goals_user_isolation ON goals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ideas_user_isolation ON ideas
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY contexts_user_isolation ON contexts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY categories_user_isolation ON categories
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY checklist_items_user_isolation ON checklist_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY settings_user_isolation ON settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY sync_meta_user_isolation ON sync_meta
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY covers_user_isolation ON covers
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Storage bucket (FR10, FR11) ─────────────────────────────────────────────
-- Bucket is private; users can only access files under their own prefix path.
-- Storage path format: {user_id[0:2]}/{user_id}/{data_hash[0:2]}/{file_id}.{ext}
-- The second folder component (index 2 in 1-based Postgres arrays) is the full user_id.

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', FALSE)
ON CONFLICT (id) DO NOTHING;

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
