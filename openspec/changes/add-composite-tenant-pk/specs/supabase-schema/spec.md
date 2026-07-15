# Delta: supabase-schema — add-composite-tenant-pk

## MODIFIED Requirements

### Requirement: Entity tables with user_id
The database SHALL have tables for `tasks`, `goals`, `ideas`, `contexts`, `categories`, `checklist_items`. Each table SHALL have a `user_id UUID NOT NULL REFERENCES auth.users(id)` column. Each entity table (including `attachments`) SHALL have a composite `PRIMARY KEY (user_id, id)` — the `id` UUID is unique per user, not globally. Each table SHALL have a composite index on `(user_id, revision)` for efficient pull queries.

#### Scenario: Task table schema
- **WHEN** migration is applied
- **THEN** `tasks` table exists with columns: `id` (UUID, part of composite PK `(user_id, id)`), `user_id` (UUID FK to auth.users), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `box` (TEXT NOT NULL CHECK in inbox/today/week/later), `goal_id` (UUID FK to goals ON DELETE SET NULL, DEFERRABLE), `context_id` (UUID FK to contexts ON DELETE SET NULL, DEFERRABLE), `category_id` (UUID FK to categories ON DELETE SET NULL, DEFERRABLE), `is_completed` (BOOLEAN DEFAULT false), `completed_at` (TIMESTAMPTZ), `repeat_rule` (JSONB, nullable), `is_hidden` (BOOLEAN DEFAULT false), `next_date` (DATE), `appear_date` (DATE), `original_task_id` (UUID, no FK constraint), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)

#### Scenario: Goals table schema
- **WHEN** migration is applied
- **THEN** `goals` table exists with columns: `id` (UUID, part of composite PK `(user_id, id)`), `user_id` (UUID FK), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `cover_hash` (TEXT NOT NULL DEFAULT ''), `status` (TEXT NOT NULL CHECK in planning/in_progress/paused/completed/cancelled), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)

#### Scenario: Index on user_id + revision
- **WHEN** migration is applied
- **THEN** each entity table has index `idx_{table}_user_revision ON {table} (user_id, revision)`

#### Scenario: Same UUID for two different users
- **WHEN** user A has a record with id `X` and user B inserts a record with the same id `X` into the same table
- **THEN** both rows coexist — no unique violation occurs

### Requirement: FK constraints on reference fields
FK reference fields SHALL use `UUID` type with `DEFERRABLE INITIALLY DEFERRED` constraints. FK constraints SHALL be composite — they SHALL include `user_id` and reference the composite primary key of the parent table, enforcing that referenced entities belong to the same user. FK constraint names SHALL be explicitly set to the `<table>_<field>_fkey` format (e.g. `tasks_goal_id_fkey`) so structured rejection reasons (`fk_violation:<field>`) remain stable. Nullable FK fields store `NULL` when unset; their `ON DELETE SET NULL` action SHALL use the column-list form (`ON DELETE SET NULL (<field>)`) so only the reference column is nulled, never `user_id`. Tables SHALL be created in dependency order: contexts, categories, covers, goals, ideas, tasks, checklist_items. Self-referencing FK fields (`original_task_id`) SHALL NOT have FK constraints. The `goals.cover_hash` field SHALL be `TEXT NOT NULL DEFAULT ''` without FK constraint — cover integrity is managed by the cover sync protocol.

#### Scenario: Task FK fields reference parent tables
- **WHEN** migration is applied
- **THEN** `tasks` has `CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (user_id, goal_id) REFERENCES goals (user_id, id)` ON DELETE SET NULL (goal_id) DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks` has `CONSTRAINT tasks_context_id_fkey FOREIGN KEY (user_id, context_id) REFERENCES contexts (user_id, id)` ON DELETE SET NULL (context_id) DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks` has `CONSTRAINT tasks_category_id_fkey FOREIGN KEY (user_id, category_id) REFERENCES categories (user_id, id)` ON DELETE SET NULL (category_id) DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.original_task_id` is `UUID` type without FK constraint

#### Scenario: Goal cover_hash has no FK constraint
- **WHEN** migration is applied
- **THEN** `goals.cover_hash` is `TEXT NOT NULL DEFAULT ''` without any FK constraint

#### Scenario: Checklist item FK field references tasks
- **WHEN** migration is applied
- **THEN** `checklist_items` has `CONSTRAINT checklist_items_task_id_fkey FOREIGN KEY (user_id, task_id) REFERENCES tasks (user_id, id)` ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED

#### Scenario: Reference to another user's entity is rejected
- **WHEN** a task is inserted for user B with `goal_id` pointing to a goal owned by user A
- **THEN** the FK constraint fails and `push_records` returns `status: "rejected"` with `reason: "fk_violation:goal_id"` for that record
