## MODIFIED Requirements

### Requirement: Entity tables with user_id
The database SHALL have tables for `tasks`, `goals`, `ideas`, `contexts`, `categories`, `checklist_items`. Each table SHALL have a `user_id UUID NOT NULL REFERENCES auth.users(id)` column. The `id` column SHALL be `UUID PRIMARY KEY`. Each table SHALL have a composite index on `(user_id, revision)` for efficient pull queries.

#### Scenario: Task table schema
- **WHEN** migration is applied
- **THEN** `tasks` table exists with columns: `id` (UUID PK), `user_id` (UUID FK to auth.users), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `box` (TEXT NOT NULL CHECK in inbox/today/week/later), `goal_id` (UUID FK to goals ON DELETE SET NULL, DEFERRABLE), `context_id` (UUID FK to contexts ON DELETE SET NULL, DEFERRABLE), `category_id` (UUID FK to categories ON DELETE SET NULL, DEFERRABLE), `is_completed` (BOOLEAN DEFAULT false), `completed_at` (TIMESTAMPTZ), `repeat_rule` (JSONB, nullable), `is_hidden` (BOOLEAN DEFAULT false), `next_date` (DATE), `appear_date` (DATE), `original_task_id` (UUID, no FK constraint), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)

#### Scenario: Goals table schema
- **WHEN** migration is applied
- **THEN** `goals` table exists with columns: `id` (UUID PK), `user_id` (UUID FK), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `cover_hash` (TEXT NOT NULL DEFAULT ''), `status` (TEXT NOT NULL CHECK in planning/in_progress/paused/completed/cancelled), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)

#### Scenario: Index on user_id + revision
- **WHEN** migration is applied
- **THEN** each entity table has index `idx_{table}_user_revision ON {table} (user_id, revision)`

### Requirement: FK constraints on reference fields
FK reference fields SHALL use `UUID` type with `DEFERRABLE INITIALLY DEFERRED` constraints. Nullable FK fields store `NULL` when unset. Tables SHALL be created in dependency order: contexts, categories, covers, goals, ideas, tasks, checklist_items. Self-referencing FK fields (`original_task_id`) SHALL NOT have FK constraints. The `goals.cover_hash` field SHALL be `TEXT NOT NULL DEFAULT ''` without FK constraint — cover integrity is managed by the cover sync protocol.

#### Scenario: Task FK fields reference parent tables
- **WHEN** migration is applied
- **THEN** `tasks.goal_id` has FK to `goals(id)` ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.context_id` has FK to `contexts(id)` ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.category_id` has FK to `categories(id)` ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.original_task_id` is `UUID` type without FK constraint

#### Scenario: Goal cover_hash has no FK constraint
- **WHEN** migration is applied
- **THEN** `goals.cover_hash` is `TEXT NOT NULL DEFAULT ''` without any FK constraint

#### Scenario: Checklist item FK field references tasks
- **WHEN** migration is applied
- **THEN** `checklist_items.task_id` has FK to `tasks(id)` ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED

### Requirement: Push RPC function
The database SHALL have a PostgreSQL function `push_records` callable via `supabase.rpc('push_records', ...)`. The function SHALL accept user_id and entity arrays (tasks, goals, contexts, categories, ideas, checklist_items, settings). It SHALL acquire a `FOR UPDATE` lock on the user's `next_revision` row in `sync_meta` (with 10-second timeout), assign the current revision to all accepted records, upsert records into entity tables in dependency order, increment `next_revision`, and return per-record results with status (`accepted`, `conflict`, `rejected`). Goal records SHALL use `cover_hash` TEXT field directly (no UUID cast needed).

#### Scenario: RPC function acquires lock and assigns revision
- **WHEN** `push_records` is called with 3 tasks
- **THEN** function acquires `FOR UPDATE` lock on `sync_meta` row `(user_id, 'next_revision')`
- **AND** all 3 tasks receive the current `next_revision` value
- **AND** `next_revision` is incremented by 1

#### Scenario: RPC function detects conflict
- **WHEN** client record has `updated_at < server record.updated_at`
- **THEN** result for that record has status `conflict` with `server_record`

#### Scenario: Lock timeout returns error
- **WHEN** `FOR UPDATE` lock cannot be acquired within 10 seconds
- **THEN** function raises an exception that Edge Function translates to `SYNC_LOCK_TIMEOUT`

#### Scenario: Goal push includes cover_hash
- **WHEN** goal with `cover_hash: "abc123..."` is pushed
- **THEN** `goals.cover_hash` is stored as TEXT `"abc123..."`
- **AND** serialized goal in response includes `cover_hash: "abc123..."`
