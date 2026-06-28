-- implements FR3, D1, D3, FR18, FR19 of add-supabase-adapter
-- implements FR6 of add-file-attachments
-- implements FR3 of fix-push-poison-pill
-- PostgreSQL RPC function: push_records
--
-- Security model: called by Edge Function using service role after validating the
-- user JWT. p_user_id is always set to the authenticated user's ID by the Edge Function.
-- The function enforces data isolation by using p_user_id in all WHERE clauses.
--
-- Processing order follows dependency graph (FR19):
-- contexts → categories → goals → ideas → tasks → checklist_items → attachments → settings
--
-- Per-record exception handling (FR3 of fix-push-poison-pill):
-- 1. SET CONSTRAINTS ALL IMMEDIATE — check FKs inside the loop
-- 2. Wrap each record in BEGIN...EXCEPTION WHEN OTHERS — isolate failures
-- 3. Return structured rejection reasons by SQLSTATE

CREATE OR REPLACE FUNCTION push_records(
  p_user_id         UUID,
  p_tasks           JSONB DEFAULT '[]',
  p_goals           JSONB DEFAULT '[]',
  p_contexts        JSONB DEFAULT '[]',
  p_categories      JSONB DEFAULT '[]',
  p_ideas           JSONB DEFAULT '[]',
  p_checklist_items JSONB DEFAULT '[]',
  p_attachments     JSONB DEFAULT '[]',
  p_settings        JSONB DEFAULT '[]'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_revision           BIGINT;
  v_rec                JSONB;
  v_rec_id             UUID;
  v_server_rec         JSONB;
  v_existing_ts        TIMESTAMPTZ;
  v_context_results    JSONB := '[]';
  v_category_results   JSONB := '[]';
  v_goal_results       JSONB := '[]';
  v_idea_results       JSONB := '[]';
  v_task_results       JSONB := '[]';
  v_checklist_results  JSONB := '[]';
  v_attachment_results JSONB := '[]';
  v_setting_results    JSONB := '[]';
  v_sqlstate           TEXT;
  v_constraint_name    TEXT;
  v_message            TEXT;
  v_rejection_reason   TEXT;
BEGIN
  -- Check deferred FK constraints immediately inside the loop, not at COMMIT (task 5.1)
  SET CONSTRAINTS ALL IMMEDIATE;

  -- Serialize concurrent pushes from the same user (D3)
  SET LOCAL lock_timeout = '10s';

  SELECT value INTO v_revision
  FROM sync_meta
  WHERE user_id = p_user_id AND key = 'next_revision'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_INITIALIZED';
  END IF;

  -- ── Contexts ─────────────────────────────────────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_contexts) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM contexts WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO contexts (id, user_id, name, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id, v_rec->>'name',
          v_rec->>'sort_order', (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ, v_revision
        );
        v_context_results := v_context_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE contexts SET
          name = v_rec->>'name', sort_order = v_rec->>'sort_order',
          is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_context_results := v_context_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'name', name, 'sort_order', sort_order, 'is_deleted', is_deleted,
          'created_at', format_timestamptz(created_at), 'updated_at', format_timestamptz(updated_at),
          'revision', revision
        ) INTO v_server_rec FROM contexts WHERE id = v_rec_id AND user_id = p_user_id;
        v_context_results := v_context_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_context_results := v_context_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Categories ───────────────────────────────────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_categories) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM categories WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO categories (id, user_id, name, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id, v_rec->>'name',
          v_rec->>'sort_order', (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ, v_revision
        );
        v_category_results := v_category_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE categories SET
          name = v_rec->>'name', sort_order = v_rec->>'sort_order',
          is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_category_results := v_category_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'name', name, 'sort_order', sort_order, 'is_deleted', is_deleted,
          'created_at', format_timestamptz(created_at), 'updated_at', format_timestamptz(updated_at),
          'revision', revision
        ) INTO v_server_rec FROM categories WHERE id = v_rec_id AND user_id = p_user_id;
        v_category_results := v_category_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_category_results := v_category_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Goals ────────────────────────────────────────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_goals) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM goals WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO goals (id, user_id, name, description, cover_hash, status, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id, v_rec->>'name', COALESCE(v_rec->>'description', ''),
          COALESCE(v_rec->>'cover_hash', ''), v_rec->>'status',
          v_rec->>'sort_order', (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ, v_revision
        );
        v_goal_results := v_goal_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE goals SET
          name = v_rec->>'name', description = COALESCE(v_rec->>'description', ''),
          cover_hash = COALESCE(v_rec->>'cover_hash', ''), status = v_rec->>'status',
          sort_order = v_rec->>'sort_order', is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_goal_results := v_goal_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'name', name, 'description', description,
          'cover_hash', cover_hash,
          'status', status, 'sort_order', sort_order, 'is_deleted', is_deleted,
          'created_at', format_timestamptz(created_at), 'updated_at', format_timestamptz(updated_at),
          'revision', revision
        ) INTO v_server_rec FROM goals WHERE id = v_rec_id AND user_id = p_user_id;
        v_goal_results := v_goal_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_goal_results := v_goal_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Ideas ────────────────────────────────────────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_ideas) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM ideas WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO ideas (id, user_id, name, description, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id, v_rec->>'name', COALESCE(v_rec->>'description', ''),
          v_rec->>'sort_order', (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ, v_revision
        );
        v_idea_results := v_idea_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE ideas SET
          name = v_rec->>'name', description = COALESCE(v_rec->>'description', ''),
          sort_order = v_rec->>'sort_order', is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_idea_results := v_idea_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'name', name, 'description', description, 'sort_order', sort_order,
          'is_deleted', is_deleted, 'created_at', format_timestamptz(created_at),
          'updated_at', format_timestamptz(updated_at), 'revision', revision
        ) INTO v_server_rec FROM ideas WHERE id = v_rec_id AND user_id = p_user_id;
        v_idea_results := v_idea_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_idea_results := v_idea_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Tasks ────────────────────────────────────────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_tasks) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM tasks WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO tasks (id, user_id, name, description, box, goal_id, context_id, category_id,
          is_completed, completed_at, repeat_rule, is_hidden, next_date, appear_date,
          original_task_id, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id,
          v_rec->>'name',            COALESCE(v_rec->>'description', ''),
          v_rec->>'box',             NULLIF(v_rec->>'goal_id', '')::UUID,
          NULLIF(v_rec->>'context_id', '')::UUID,  NULLIF(v_rec->>'category_id', '')::UUID,
          (v_rec->>'is_completed')::BOOLEAN,   parse_timestamptz(v_rec->>'completed_at'),
          parse_repeat_rule(v_rec->>'repeat_rule'), (v_rec->>'is_hidden')::BOOLEAN,
          parse_date(v_rec->>'next_date'),     parse_date(v_rec->>'appear_date'),
          NULLIF(v_rec->>'original_task_id', '')::UUID,
          v_rec->>'sort_order',     (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ,
          v_revision
        );
        v_task_results := v_task_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE tasks SET
          name = v_rec->>'name',                      description = COALESCE(v_rec->>'description', ''),
          box = v_rec->>'box',                         goal_id = NULLIF(v_rec->>'goal_id', '')::UUID,
          context_id = NULLIF(v_rec->>'context_id', '')::UUID, category_id = NULLIF(v_rec->>'category_id', '')::UUID,
          is_completed = (v_rec->>'is_completed')::BOOLEAN, completed_at = parse_timestamptz(v_rec->>'completed_at'),
          repeat_rule = parse_repeat_rule(v_rec->>'repeat_rule'), is_hidden = (v_rec->>'is_hidden')::BOOLEAN,
          next_date = parse_date(v_rec->>'next_date'), appear_date = parse_date(v_rec->>'appear_date'),
          original_task_id = NULLIF(v_rec->>'original_task_id', '')::UUID,
          sort_order = v_rec->>'sort_order', is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_task_results := v_task_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'name', name, 'description', description, 'box', box,
          'goal_id', COALESCE(goal_id::text, ''), 'context_id', COALESCE(context_id::text, ''),
          'category_id', COALESCE(category_id::text, ''),
          'is_completed', is_completed, 'completed_at', format_timestamptz(completed_at),
          'repeat_rule', COALESCE(repeat_rule::text, ''), 'is_hidden', is_hidden,
          'next_date', COALESCE(next_date::text, ''), 'appear_date', COALESCE(appear_date::text, ''),
          'original_task_id', COALESCE(original_task_id::text, ''), 'sort_order', sort_order,
          'is_deleted', is_deleted, 'created_at', format_timestamptz(created_at),
          'updated_at', format_timestamptz(updated_at), 'revision', revision
        ) INTO v_server_rec FROM tasks WHERE id = v_rec_id AND user_id = p_user_id;
        v_task_results := v_task_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_task_results := v_task_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Checklist items ───────────────────────────────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_checklist_items) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM checklist_items WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO checklist_items (id, user_id, task_id, name, is_completed, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id, (v_rec->>'task_id')::UUID, v_rec->>'name',
          (v_rec->>'is_completed')::BOOLEAN, v_rec->>'sort_order',
          (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ, v_revision
        );
        v_checklist_results := v_checklist_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE checklist_items SET
          task_id = (v_rec->>'task_id')::UUID, name = v_rec->>'name',
          is_completed = (v_rec->>'is_completed')::BOOLEAN,
          sort_order = v_rec->>'sort_order', is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_checklist_results := v_checklist_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'task_id', task_id::text, 'name', name,
          'is_completed', is_completed, 'sort_order', sort_order, 'is_deleted', is_deleted,
          'created_at', format_timestamptz(created_at), 'updated_at', format_timestamptz(updated_at),
          'revision', revision
        ) INTO v_server_rec FROM checklist_items WHERE id = v_rec_id AND user_id = p_user_id;
        v_checklist_results := v_checklist_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_checklist_results := v_checklist_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Attachments (FR6 of add-file-attachments) ──────────────────────────────
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_attachments) AS value LOOP
    BEGIN
      v_rec_id := (v_rec->>'id')::UUID;
      SELECT updated_at INTO v_existing_ts FROM attachments WHERE id = v_rec_id AND user_id = p_user_id;

      IF NOT FOUND THEN
        INSERT INTO attachments (id, user_id, entity_type, entity_id, data_hash, filename,
          mime_type, file_size, sort_order, is_deleted, created_at, updated_at, revision)
        VALUES (
          v_rec_id, p_user_id, v_rec->>'entity_type', (v_rec->>'entity_id')::UUID,
          v_rec->>'data_hash', v_rec->>'filename', v_rec->>'mime_type',
          (v_rec->>'file_size')::INTEGER, v_rec->>'sort_order',
          (v_rec->>'is_deleted')::BOOLEAN,
          (v_rec->>'created_at')::TIMESTAMPTZ, (v_rec->>'updated_at')::TIMESTAMPTZ, v_revision
        );
        v_attachment_results := v_attachment_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE attachments SET
          entity_type = v_rec->>'entity_type', entity_id = (v_rec->>'entity_id')::UUID,
          data_hash = v_rec->>'data_hash', filename = v_rec->>'filename',
          mime_type = v_rec->>'mime_type', file_size = (v_rec->>'file_size')::INTEGER,
          sort_order = v_rec->>'sort_order', is_deleted = (v_rec->>'is_deleted')::BOOLEAN,
          updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ, revision = v_revision
        WHERE id = v_rec_id AND user_id = p_user_id;
        v_attachment_results := v_attachment_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'id', id::text, 'entity_type', entity_type, 'entity_id', entity_id::text,
          'data_hash', data_hash, 'filename', filename, 'mime_type', mime_type,
          'file_size', file_size, 'sort_order', sort_order, 'is_deleted', is_deleted,
          'created_at', format_timestamptz(created_at), 'updated_at', format_timestamptz(updated_at),
          'revision', revision
        ) INTO v_server_rec FROM attachments WHERE id = v_rec_id AND user_id = p_user_id;
        v_attachment_results := v_attachment_results || jsonb_build_array(
          jsonb_build_object('id', v_rec->>'id', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_attachment_results := v_attachment_results || jsonb_build_array(
        jsonb_build_object('id', v_rec->>'id', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Settings ─────────────────────────────────────────────────────────────
  -- Settings have no revision; conflict is based on updated_at only
  FOR v_rec IN SELECT value FROM jsonb_array_elements(p_settings) AS value LOOP
    BEGIN
      SELECT updated_at INTO v_existing_ts FROM settings WHERE user_id = p_user_id AND key = v_rec->>'key';

      IF NOT FOUND THEN
        INSERT INTO settings (user_id, key, value, updated_at)
        VALUES (p_user_id, v_rec->>'key', v_rec->>'value', (v_rec->>'updated_at')::TIMESTAMPTZ);
        v_setting_results := v_setting_results || jsonb_build_array(
          jsonb_build_object('key', v_rec->>'key', 'status', 'created'));

      ELSIF (v_rec->>'updated_at')::TIMESTAMPTZ >= v_existing_ts THEN
        UPDATE settings SET value = v_rec->>'value', updated_at = (v_rec->>'updated_at')::TIMESTAMPTZ
        WHERE user_id = p_user_id AND key = v_rec->>'key';
        v_setting_results := v_setting_results || jsonb_build_array(
          jsonb_build_object('key', v_rec->>'key', 'status', 'accepted'));

      ELSE
        SELECT jsonb_build_object(
          'key', key, 'value', value, 'updated_at', format_timestamptz(updated_at)
        ) INTO v_server_rec FROM settings WHERE user_id = p_user_id AND key = v_rec->>'key';
        v_setting_results := v_setting_results || jsonb_build_array(
          jsonb_build_object('key', v_rec->>'key', 'status', 'conflict', 'server_record', v_server_rec));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_sqlstate = RETURNED_SQLSTATE,
                              v_constraint_name = CONSTRAINT_NAME,
                              v_message = MESSAGE_TEXT;
      v_rejection_reason := CASE v_sqlstate
        WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
        WHEN '23514' THEN 'check_violation:' || v_constraint_name
        WHEN '23505' THEN 'unique_violation'
        ELSE v_message
      END;
      v_setting_results := v_setting_results || jsonb_build_array(
        jsonb_build_object('key', v_rec->>'key', 'status', 'rejected', 'reason', v_rejection_reason));
    END;
  END LOOP;

  -- ── Assign revision and return results ────────────────────────────────────
  UPDATE sync_meta SET value = v_revision + 1
  WHERE user_id = p_user_id AND key = 'next_revision';

  RETURN jsonb_build_object(
    'revision', v_revision,
    'results', jsonb_build_object(
      'tasks',           v_task_results,
      'goals',           v_goal_results,
      'contexts',        v_context_results,
      'categories',      v_category_results,
      'ideas',           v_idea_results,
      'checklist_items', v_checklist_results,
      'attachments',     v_attachment_results,
      'settings',        v_setting_results
    )
  );
END;
$$;
