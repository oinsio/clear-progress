-- implements FR7, FR12, FR13, FR14, FR18 of add-supabase-adapter
-- implements FR4, FR5 of add-file-attachments
-- Entity tables, sync_meta, settings, files, attachments + helper functions

-- ─── Helper functions ───────────────────────────────────────────────────────

-- Serialize TIMESTAMPTZ → ISO 8601 with Z suffix; NULL → ''
CREATE OR REPLACE FUNCTION format_timestamptz(p_ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_ts IS NULL THEN RETURN ''; END IF;
  RETURN to_char(p_ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
END;
$$;

-- Parse optional TIMESTAMPTZ: '' / NULL → NULL
CREATE OR REPLACE FUNCTION parse_timestamptz(p_val TEXT)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_val IS NULL OR p_val = '' THEN RETURN NULL; END IF;
  RETURN p_val::TIMESTAMPTZ;
END;
$$;

-- Parse optional DATE: '' / NULL → NULL
CREATE OR REPLACE FUNCTION parse_date(p_val TEXT)
RETURNS DATE LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_val IS NULL OR p_val = '' THEN RETURN NULL; END IF;
  RETURN p_val::DATE;
END;
$$;

-- Parse optional repeat_rule: '' / NULL → NULL, valid JSON → JSONB
CREATE OR REPLACE FUNCTION parse_repeat_rule(p_val TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_val IS NULL OR p_val = '' THEN RETURN NULL; END IF;
  RETURN p_val::JSONB;
END;
$$;

-- ─── Settings table (FR7) ───────────────────────────────────────────────────
-- No revision — uses updated_at for incremental pull and conflict detection

CREATE TABLE IF NOT EXISTS settings (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- ─── Sync meta table (FR3) ──────────────────────────────────────────────────
-- Per-user key-value store for revision counters (next_revision, purge_revision)

CREATE TABLE IF NOT EXISTS sync_meta (
  user_id UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key     TEXT   NOT NULL,
  value   BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, key)
);

-- ─── Files metadata table (FR4 of add-file-attachments) ─────────────────────
-- File data lives in Storage bucket; this table tracks metadata

CREATE TABLE IF NOT EXISTS files (
  file_id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename     TEXT    NOT NULL,
  mime_type    TEXT    NOT NULL,
  data_hash    TEXT    NOT NULL,
  storage_path TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_files_user_hash ON files (user_id, data_hash);

-- ─── Attachments table (FR5 of add-file-attachments) ────────────────────────

CREATE TABLE IF NOT EXISTS attachments (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('task', 'goal', 'idea')),
  entity_id   UUID        NOT NULL,
  data_hash   TEXT        NOT NULL,
  filename    TEXT        NOT NULL,
  mime_type   TEXT        NOT NULL,
  file_size   INTEGER     NOT NULL,
  sort_order  TEXT        NOT NULL DEFAULT '0',
  is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,
  revision    BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);

-- implements FR10, NFR-P2 of fix-pull-pagination: composite index for keyset pagination
CREATE INDEX IF NOT EXISTS idx_attachments_user_revision_id
  ON attachments (user_id, revision, id);

CREATE INDEX IF NOT EXISTS idx_attachments_entity
  ON attachments (entity_type, entity_id);

-- ─── Entity tables (dependency order for FK constraints, FR18) ────────────────

CREATE TABLE IF NOT EXISTS contexts (
  id         UUID        NOT NULL,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  sort_order TEXT        NOT NULL DEFAULT '0',
  is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revision   BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_contexts_user_revision_id ON contexts (user_id, revision, id);

CREATE TABLE IF NOT EXISTS categories (
  id         UUID        NOT NULL,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  sort_order TEXT        NOT NULL DEFAULT '0',
  is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revision   BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_categories_user_revision_id ON categories (user_id, revision, id);

CREATE TABLE IF NOT EXISTS goals (
  id            UUID        NOT NULL,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  cover_hash    TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL CHECK (status IN ('planning', 'in_progress', 'paused', 'completed', 'cancelled')),
  sort_order    TEXT        NOT NULL DEFAULT '0',
  is_deleted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL,
  revision      BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_goals_user_revision_id ON goals (user_id, revision, id);

CREATE TABLE IF NOT EXISTS ideas (
  id          UUID        NOT NULL,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  sort_order  TEXT        NOT NULL DEFAULT '0',
  is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,
  revision    BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_ideas_user_revision_id ON ideas (user_id, revision, id);

CREATE TABLE IF NOT EXISTS tasks (
  id               UUID        NOT NULL,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT        NOT NULL DEFAULT '',
  box              TEXT        NOT NULL CHECK (box IN ('inbox', 'today', 'week', 'later')),
  goal_id          UUID,
  context_id       UUID,
  category_id      UUID,
  is_completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  repeat_rule      JSONB,
  is_hidden        BOOLEAN     NOT NULL DEFAULT FALSE,
  next_date        DATE,
  appear_date      DATE,
  original_task_id UUID,
  sort_order       TEXT        NOT NULL DEFAULT '0',
  is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL,
  revision         BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (user_id, goal_id) REFERENCES goals (user_id, id) ON DELETE SET NULL (goal_id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tasks_context_id_fkey FOREIGN KEY (user_id, context_id) REFERENCES contexts (user_id, id) ON DELETE SET NULL (context_id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT tasks_category_id_fkey FOREIGN KEY (user_id, category_id) REFERENCES categories (user_id, id) ON DELETE SET NULL (category_id) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_revision_id ON tasks (user_id, revision, id);

CREATE TABLE IF NOT EXISTS checklist_items (
  id           UUID        NOT NULL,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id      UUID        NOT NULL,
  name         TEXT        NOT NULL,
  is_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  sort_order   TEXT        NOT NULL DEFAULT '0',
  is_deleted   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL,
  revision     BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  CONSTRAINT checklist_items_task_id_fkey FOREIGN KEY (user_id, task_id) REFERENCES tasks (user_id, id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_revision_id ON checklist_items (user_id, revision, id);
