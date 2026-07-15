# add-composite-tenant-pk

## Why

Supabase entity tables (`contexts`, `categories`, `goals`, `ideas`, `tasks`, `checklist_items`, `attachments`) use a global `PRIMARY KEY (id)` while UUIDs are generated client-side. User isolation rests solely on `user_id` filters in code (Edge Functions, RPC, RLS), not on the database schema:

- a UUID collision between users (or a maliciously supplied foreign UUID) results in a permanent `rejected: unique_violation` for the record;
- FK constraints (`tasks.goal_id → goals(id)` etc.) do not verify ownership — an authenticated user can create a reference to another user's entity.

The project is not in production yet — the schema can be rebuilt from scratch with no data migration. This is the last cheap moment to add schema-level defense-in-depth.

## What Changes

- **MODIFIED**: entity tables get a composite `PRIMARY KEY (user_id, id)` instead of `PRIMARY KEY (id)`.
- **MODIFIED**: FK constraints become composite and enforce ownership: `(user_id, goal_id) REFERENCES goals (user_id, id)` etc.
- **MODIFIED**: `ON DELETE SET NULL` uses the column-list form (PG 15+) so only the reference column is nulled, never `user_id`.
- Existing migration files are updated **in place** (no new files) — the database is recreated manually.
- Sync protocol behavior (push/pull/purge) and the client remain unchanged.

## Capabilities

### New Capabilities

_none_

### Modified Capabilities

- `supabase-schema`: primary key and FK constraint requirements for entity tables — composite PK `(user_id, id)`, composite ownership-enforcing FKs, stable constraint names.

## Goals

- G1: User isolation is enforced at the database schema level (PK and FK), not only in code.
- G2: Cross-user UUID collisions become impossible by construction (`id` is unique per user).
- G3: A reference to another user's entity is rejected by the database as `fk_violation`.
- G4: The number of migration files does not grow — edits go into existing files.

## Non-Goals

- NG1: The `files` table — its PK `file_id` is server-generated (`gen_random_uuid()`) and has no incoming FKs; untouched.
- NG2: `settings` and `sync_meta` — already have composite PK `(user_id, key)`; untouched.
- NG3: Data migration path for existing data — no production yet, the database is recreated manually.
- NG4: Changes to the sync protocol, API formats, or client code (except tests if needed).
- NG5: The GAS backend.

## Users & Scenarios

- U1: A user syncs data — behavior is unchanged, push/pull work as before.
- U2: Two users accidentally (or one maliciously) use the same UUID — both records are stored independently, no `unique_violation`.
- U3: A malicious authenticated user pushes a task with the `goal_id` of another user's goal — the database rejects the record as `fk_violation:goal_id`, and client-side self-healing clears the reference.

## Requirements

### Functional

- FR1: Tables `contexts`, `categories`, `goals`, `ideas`, `tasks`, `checklist_items`, `attachments` have `PRIMARY KEY (user_id, id)`.
- FR2: FK constraints reference the composite key and include `user_id`: `tasks (user_id, goal_id) → goals (user_id, id)`, `tasks (user_id, context_id) → contexts (user_id, id)`, `tasks (user_id, category_id) → categories (user_id, id)`, `checklist_items (user_id, task_id) → tasks (user_id, id)`. The `DEFERRABLE INITIALLY DEFERRED` property and `ON DELETE` actions are preserved.
- FR3: For nullable references, `ON DELETE SET NULL` applies only to the reference column (the `ON DELETE SET NULL (<column>)` form); `user_id` is never nulled.
- FR4: FK constraint names keep the `<table>_<field>_fkey` format (set explicitly) so the rejection reason parsing in `push_records` (`fk_violation:<field>`) and client-side self-healing (`pushRejectionHandler`) keep working unchanged.
- FR5: Edits go into the existing files `001_create_tables.sql`–`004_purge_bump_dependent_revision.sql`; no new migration files are created.
- FR6: Observable behavior of `push_records` and `purge_deleted_records` for valid data does not change (same statuses, response formats, reason codes).
- FR7: Cross-tenant scenarios (U2, U3) are covered by integration tests added to the existing poison-pill suite in `packages/integration`.

### Non-Functional

#### Performance

- NFR-P1: The keyset pagination index `(user_id, revision, id)` is preserved on all entity tables; pull query plans do not degrade.

#### Accessibility

_not applicable — server-side schema change_

#### Responsive

_not applicable — server-side schema change_

## UX Acceptance Criteria

- UX1: The user notices no difference: sync, conflicts, and self-healing behave as before.

## UI States Matrix

_not applicable — no UI affected_

## Behavior

No new user-facing scenarios — this is a database schema change. Behavior is verified by integration tests (`packages/integration`, Testcontainers applies the updated migrations) and existing contract tests. No Gherkin features are added.

## Visual Reference

_not applicable_

## Affected IA

no changes

## Success Metrics

- M1: All existing integration and contract tests pass without changing expectations (100%).
- M2: The number of files in `packages/adapter-supabase/supabase/migrations/` stays at 4.
- M3: A full from-scratch schema rebuild (docker-compose from `packages/integration`) applies migrations without errors.
- M4: Cross-tenant scenarios (U2, U3) are covered by at least two automated checks.

## Open Questions

_none — Q1 (whether to add cross-tenant integration tests requiring two users in one instance) resolved: yes, added to the existing poison-pill suite (FR7)._
