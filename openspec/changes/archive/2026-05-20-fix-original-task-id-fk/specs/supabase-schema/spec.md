## MODIFIED Requirements

### Requirement: FK constraints on reference fields
FK reference fields SHALL use `UUID` type with `DEFERRABLE INITIALLY DEFERRED` constraints. Nullable FK fields store `NULL` when unset. Tables SHALL be created in dependency order: contexts, categories, covers, goals, ideas, tasks, checklist_items. Self-referencing FK fields (`original_task_id`) SHALL NOT have FK constraints — referential integrity for these fields is managed client-side.

#### Scenario: Task FK fields reference parent tables
- **WHEN** migration is applied
- **THEN** `tasks.goal_id` has FK to `goals(id)` ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.context_id` has FK to `contexts(id)` ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.category_id` has FK to `categories(id)` ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED
- **AND** `tasks.original_task_id` is `UUID` type without FK constraint

#### Scenario: Task table schema
- **WHEN** migration is applied
- **THEN** `tasks` table exists with columns: `id` (UUID PK), `user_id` (UUID FK to auth.users), `name` (TEXT NOT NULL), `description` (TEXT DEFAULT ''), `box` (TEXT NOT NULL CHECK in inbox/today/week/later), `goal_id` (UUID FK to goals ON DELETE SET NULL, DEFERRABLE), `context_id` (UUID FK to contexts ON DELETE SET NULL, DEFERRABLE), `category_id` (UUID FK to categories ON DELETE SET NULL, DEFERRABLE), `is_completed` (BOOLEAN DEFAULT false), `completed_at` (TIMESTAMPTZ), `repeat_rule` (JSONB, nullable), `is_hidden` (BOOLEAN DEFAULT false), `next_date` (DATE), `appear_date` (DATE), `original_task_id` (UUID, no FK constraint), `sort_order` (INTEGER DEFAULT 0), `is_deleted` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ NOT NULL), `updated_at` (TIMESTAMPTZ NOT NULL), `revision` (BIGINT DEFAULT 0)
