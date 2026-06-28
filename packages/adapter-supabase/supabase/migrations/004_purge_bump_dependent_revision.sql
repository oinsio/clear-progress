-- implements FR4 of fix-push-poison-pill
-- Before hard-deleting soft-deleted parent records during purge,
-- bump revision/updated_at on dependent child records whose FK will be nullified or cascaded.
-- This ensures other devices learn about the FK change via pull.
--
-- FK relationships handled:
--   goals      -> tasks           (goal_id,     ON DELETE SET NULL)
--   contexts   -> tasks           (context_id,  ON DELETE SET NULL)
--   categories -> tasks           (category_id, ON DELETE SET NULL)
--   tasks      -> checklist_items (task_id,     ON DELETE CASCADE)

CREATE OR REPLACE FUNCTION purge_deleted_records(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_revision    BIGINT;
  v_purge_revision   BIGINT;
  v_bumped_tasks     BIGINT := 0;
  v_bumped_checklist BIGINT := 0;
  v_deleted_tasks           BIGINT := 0;
  v_deleted_goals           BIGINT := 0;
  v_deleted_ideas           BIGINT := 0;
  v_deleted_contexts        BIGINT := 0;
  v_deleted_categories      BIGINT := 0;
  v_deleted_checklist_items BIGINT := 0;
  v_deleted_attachments     BIGINT := 0;
BEGIN
  -- Lock next_revision to prevent concurrent push/purge conflicts
  SET LOCAL lock_timeout = '10s';

  SELECT value INTO v_next_revision
  FROM sync_meta
  WHERE user_id = p_user_id AND key = 'next_revision'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_INITIALIZED';
  END IF;

  SELECT COALESCE(value, 0) INTO v_purge_revision
  FROM sync_meta
  WHERE user_id = p_user_id AND key = 'purge_revision';

  -- ── Step 1: Bump dependent records BEFORE deleting parents ─────────────

  -- 1a. Tasks referencing soft-deleted goals
  UPDATE tasks
  SET goal_id = NULL,
      revision = v_next_revision,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND goal_id IS NOT NULL
    AND goal_id IN (SELECT id FROM goals WHERE is_deleted = true AND user_id = p_user_id);

  GET DIAGNOSTICS v_bumped_tasks = ROW_COUNT;

  -- 1b. Tasks referencing soft-deleted contexts
  UPDATE tasks
  SET context_id = NULL,
      revision = v_next_revision,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND context_id IS NOT NULL
    AND context_id IN (SELECT id FROM contexts WHERE is_deleted = true AND user_id = p_user_id);

  GET DIAGNOSTICS v_bumped_checklist = ROW_COUNT;
  v_bumped_tasks := v_bumped_tasks + v_bumped_checklist;

  -- 1c. Tasks referencing soft-deleted categories
  UPDATE tasks
  SET category_id = NULL,
      revision = v_next_revision,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND category_id IS NOT NULL
    AND category_id IN (SELECT id FROM categories WHERE is_deleted = true AND user_id = p_user_id);

  GET DIAGNOSTICS v_bumped_checklist = ROW_COUNT;
  v_bumped_tasks := v_bumped_tasks + v_bumped_checklist;

  -- 1d. Checklist items referencing soft-deleted tasks (will be cascade-deleted)
  --     Mark them as deleted with bumped revision so other devices see the change
  UPDATE checklist_items
  SET is_deleted = true,
      revision = v_next_revision,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND is_deleted = false
    AND task_id IN (SELECT id FROM tasks WHERE is_deleted = true AND user_id = p_user_id);

  GET DIAGNOSTICS v_bumped_checklist = ROW_COUNT;

  -- Advance next_revision if any dependents were bumped
  IF v_bumped_tasks > 0 OR v_bumped_checklist > 0 THEN
    UPDATE sync_meta SET value = v_next_revision + 1
    WHERE user_id = p_user_id AND key = 'next_revision';
  END IF;

  -- ── Step 2: Hard-delete all soft-deleted records ───────────────────────
  -- Order: children first, then parents (respect FK dependencies)

  DELETE FROM checklist_items WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_checklist_items = ROW_COUNT;

  DELETE FROM attachments WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_attachments = ROW_COUNT;

  DELETE FROM tasks WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_tasks = ROW_COUNT;

  DELETE FROM goals WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_goals = ROW_COUNT;

  DELETE FROM ideas WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_ideas = ROW_COUNT;

  DELETE FROM contexts WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_contexts = ROW_COUNT;

  DELETE FROM categories WHERE user_id = p_user_id AND is_deleted = true;
  GET DIAGNOSTICS v_deleted_categories = ROW_COUNT;

  -- ── Step 3: Bump purge_revision ────────────────────────────────────────

  UPDATE sync_meta SET value = v_purge_revision + 1
  WHERE user_id = p_user_id AND key = 'purge_revision';

  RETURN jsonb_build_object(
    'purge_revision', v_purge_revision + 1,
    'bumped', jsonb_build_object(
      'tasks', v_bumped_tasks,
      'checklist_items', v_bumped_checklist
    ),
    'purged', jsonb_build_object(
      'tasks', v_deleted_tasks,
      'goals', v_deleted_goals,
      'ideas', v_deleted_ideas,
      'contexts', v_deleted_contexts,
      'categories', v_deleted_categories,
      'checklist_items', v_deleted_checklist_items,
      'attachments', v_deleted_attachments
    )
  );
END;
$$;
