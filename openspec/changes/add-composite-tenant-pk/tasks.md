# Tasks: add-composite-tenant-pk

## 1. Schema migration (in-place edits)

- [x] 1.1 `001_create_tables.sql`: replace `PRIMARY KEY` with composite `PRIMARY KEY (user_id, id)` in `contexts`, `categories`, `goals`, `ideas`, `tasks`, `checklist_items`, `attachments` (FR1, FR5)
- [x] 1.2 `001_create_tables.sql`: rewrite FKs `tasks.goal_id`/`context_id`/`category_id` as composite `FOREIGN KEY (user_id, <field>) REFERENCES <parent> (user_id, id)` with explicit names `tasks_<field>_fkey` and `ON DELETE SET NULL (<field>)`, preserving `DEFERRABLE INITIALLY DEFERRED` (FR2, FR3, FR4)
- [x] 1.3 `001_create_tables.sql`: rewrite FK `checklist_items.task_id` as composite with explicit name `checklist_items_task_id_fkey` and `ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED` (FR2, FR4)
- [x] 1.4 Refresh comments in `003_create_push_rpc.sql` / `004_purge_bump_dependent_revision.sql` if they describe key structure; do not change SQL logic (FR6)

## 2. Verification — schema applies cleanly

- [x] 2.1 Run migrations from scratch in the Testcontainers environment (`packages/integration`, `supabase/postgres:15.14.1.122`) — all 4 files apply without errors, including the `ON DELETE SET NULL (<column>)` syntax (M3)
- [x] 2.2 Verify via `pg_constraint`/`\d` (SQL query in the integration setup or manually) that FK names are `tasks_goal_id_fkey`, `tasks_context_id_fkey`, `tasks_category_id_fkey`, `checklist_items_task_id_fkey` (FR4)

## 3. Verification — cross-tenant isolation (automated)

- [x] 3.1 Integration test in the existing poison-pill suite: two users push records with the same UUID — both get `status: created`, both rows exist (U2, FR7, M4)
- [x] 3.2 Integration test in the existing poison-pill suite: user B pushes a task with `goal_id` of user A's goal — response is `status: rejected, reason: fk_violation:goal_id`; a repeat push after client-side self-healing succeeds (U3, FR7, M4)

## 4. Verification — no behavior regression

- [x] 4.1 Run the entire existing integration suite (`packages/integration`) — once, at the end, no parallel runs (M1, FR6, NFR-P1)
- [x] 4.2 Confirm the migration file count is still 4 and client code (`pushRejectionHandler`, sync) required no changes (M2, FR5, FR6)

## 5. Manual follow-up (user)

- [ ] 5.1 Recreate environments manually: `bash scripts/reset.sh dev|qa` (+ the prod project if needed) — outside the agent's scope
