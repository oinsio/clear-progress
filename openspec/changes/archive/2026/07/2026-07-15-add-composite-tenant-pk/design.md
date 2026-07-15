# Design: add-composite-tenant-pk

## Context

User isolation is implemented at three levels (the Edge Function filters by `p_user_id`, the RPC filters every query, RLS policies), but the database schema does not enforce it: `PRIMARY KEY (id)` is global and FKs do not verify ownership. The project is not in production — no data migration; the database is recreated manually. The Testcontainers environment (`packages/integration/docker-compose.yml`) uses `supabase/postgres:15.14.1.122`.

Driven by FR1–FR7 from the proposal.

## Goals / Non-Goals

**Goals:**

- Composite PK `(user_id, id)` and composite ownership-enforcing FKs (FR1, FR2).
- Zero changes in observable sync protocol and client behavior (FR6).
- Edits only in existing migration files (FR5).

**Non-Goals:**

- Data migration, `files`, `settings`, `sync_meta`, the GAS backend (NG1–NG5 from the proposal).

## Decisions

### D1: Explicit FK constraint names in the `<table>_<field>_fkey` format

Implements FR4. The default name for a composite FK in Postgres is `tasks_user_id_goal_id_fkey`. The regexp in `push_records` (`'^.*?_(.+?)_fkey$'`) would extract `user_id_goal_id` from it, breaking client-side self-healing: `pushRejectionHandler.ts` matches the field against the `CLEARABLE_FK_FIELDS` / `DELETE_FK_FIELDS` sets (`goal_id`, `context_id`, `category_id`, `task_id`).

Decision: set names explicitly — `CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (user_id, goal_id) REFERENCES goals (user_id, id) ...`.

Alternative (rejected): change the regexp in the RPC and/or the client handler — touches two packages and the rejection-reason contract for the sake of schema cosmetics.

### D2: `ON DELETE SET NULL (<column>)` — column-list form

Implements FR3. A plain `ON DELETE SET NULL` on a composite FK would null both columns, including `user_id NOT NULL` → an error when triggered. Postgres 15+ supports specifying a column subset: `ON DELETE SET NULL (goal_id)`. The infrastructure runs PG 15.14 — the syntax is available.

`checklist_items.task_id` keeps `ON DELETE CASCADE` — cascading works with composite FKs without caveats.

Alternative (rejected): drop the `ON DELETE` actions, since rows are only deleted during purge where dependencies are cleaned up manually. Rejected: the cascade from `auth.users` (account deletion) and hard deletes in `purge_deleted_records` rely on the current FK actions.

### D3: RPC functions remain unchanged

`push_records` (003) and `purge_deleted_records` (004) already filter every query by `user_id` and insert `user_id` explicitly — with a composite PK their SQL is correct without edits. Only comments change, if they describe key structure. This keeps the diff minimal and confirms FR6.

Semantic consequence: the `unique_violation` branch in `push_records` becomes unreachable for cross-user collisions (another user's INSERT with the same `id` is now legal); the handler itself stays — it also catches other 23505 cases.

### D4: Scope — only tables with client-generated UUIDs

The PK changes on `contexts`, `categories`, `goals`, `ideas`, `tasks`, `checklist_items`, `attachments`. `files.file_id` is server-generated and not part of the push protocol; `settings`/`sync_meta` are already composite (NG1, NG2).

### D5: No index changes

Implements NFR-P1. The keyset indexes `idx_<table>_user_revision_id (user_id, revision, id)` remain. The composite PK provides a `(user_id, id)` index — it covers all point lookups in the RPC (`WHERE id = ... AND user_id = ...`). The old unique index on `(id)` disappears — no query looks up by `id` without `user_id`.

### D6: Cross-tenant integration tests live in the existing poison-pill suite

Implements FR7. The scenarios (same UUID for two users; FK to another user's goal) require two registered users in one Testcontainers instance. The poison-pill suite (`packages/integration/src/tests/push-poison-pill-*.spec.ts`) already exercises push rejection paths and the self-healing flow — the new scenarios extend it rather than introducing a new suite.

## Risks / Trade-offs

- [Cross-tenant scenarios cannot be verified without two users] → integration test with two registered users in one Testcontainers instance (D6).
- [Editing already-applied migration files diverges from deployed environments] → deliberate: the user recreates dev/qa/prod manually (`scripts/reset.sh`); the edit is visible in git history.
- [`SET NULL (column)` syntax unsupported on older PG] → infrastructure is pinned to PG 15.14; verified by the docker-compose migration run (M3).
- [An unnoticed dependency on global `id` uniqueness] → pull, push, purge, and the client all operate on data within a single user; confirmed by the full integration test run (M1).

## Migration Plan

1. Update `001_create_tables.sql`: composite PKs, explicitly named composite FKs, `SET NULL (<column>)`.
2. Refresh comments in `003`/`004` if they describe key structure (SQL logic unchanged).
3. Run integration tests (Testcontainers rebuilds the schema from scratch).
4. The user manually recreates environments (`bash scripts/reset.sh <env>`).

Rollback: git revert of the migration edits + re-reset of environments.

## Open Questions

_none — Q1 from the proposal resolved in favor of adding cross-tenant integration tests to the poison-pill suite (D6)._
