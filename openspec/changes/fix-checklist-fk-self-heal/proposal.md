# fix-checklist-fk-self-heal

## Why

The `push_records` RPC derives the structured rejection reason `fk_violation:<field>` from the FK constraint name via the regexp `^.*?_(.+?)_fkey$`. That regexp assumes the table name has no underscore, so for `checklist_items_task_id_fkey` it extracts `items_task_id` instead of `task_id`. The client `pushRejectionHandler` only recognizes `task_id` (in `DELETE_FK_FIELDS`), so a checklist item whose parent task no longer exists is reported as `fk_violation:items_task_id`, matches nothing, and is left permanently `rejected` instead of being self-healed (soft-deleted).

This is a pre-existing latent bug (the old inline FK auto-generated the same constraint name) that became reachable for cross-tenant references after `add-composite-tenant-pk` made `checklist_items.task_id` a composite ownership-enforcing FK.

## What Changes

- **MODIFIED**: the reason-extraction regexp in `push_records` (`003_create_push_rpc.sql`) becomes underscore-safe — it anchors on the trailing `<field>_id` segment so `checklist_items_task_id_fkey` yields `task_id`, while `tasks_goal_id_fkey` / `tasks_context_id_fkey` / `tasks_category_id_fkey` keep yielding `goal_id` / `context_id` / `category_id`.
- FK constraint names are unchanged (`checklist_items_task_id_fkey` stays per convention).
- The client (`pushRejectionHandler`) is unchanged — it already handles `fk_violation:task_id` → soft-delete.
- The migration file is edited **in place** (no new file); the database is recreated manually.

## Capabilities

### New Capabilities

_none_

### Modified Capabilities

- `push-poison-pill-protection`: the server-side rejection-reason contract SHALL extract the FK field name correctly even when the table name contains underscores, so `checklist_items` FK violations are healable by the client.

## Goals

- G1: A checklist item referencing a non-existent/foreign task is rejected as `fk_violation:task_id` (not `items_task_id`).
- G2: The client self-heals such a checklist item by soft-deleting it, with no code change on the client.
- G3: Reason extraction for `tasks` FK fields (`goal_id`, `context_id`, `category_id`) is unchanged.

## Non-Goals

- NG1: Renaming FK constraints or changing the `<table>_<field>_fkey` naming convention.
- NG2: Any change to `pushRejectionHandler` or other client code.
- NG3: Changing which fields are clearable vs deletable (the `CLEARABLE_FK_FIELDS` / `DELETE_FK_FIELDS` sets stay as-is).
- NG4: Data migration — no production yet, the database is recreated manually.
- NG5: The GAS backend.

## Users & Scenarios

- U1: A user deletes/purges a task on device A; device B (offline) still has a checklist item under that task and pushes it. The server rejects it as `fk_violation:task_id`; the client soft-deletes the orphaned checklist item and the record settles.
- U2: A malicious/colliding user B pushes a checklist item referencing user A's task id. The composite FK rejects it as `fk_violation:task_id`; the client self-heals by soft-deleting.

## Requirements

### Functional

- FR1: `push_records` SHALL return `reason: "fk_violation:task_id"` when a `checklist_items` insert violates `checklist_items_task_id_fkey` (SQLSTATE 23503).
- FR2: `push_records` SHALL continue to return `reason: "fk_violation:goal_id"`, `"fk_violation:context_id"`, `"fk_violation:category_id"` for the corresponding `tasks` FK violations.
- FR3: The reason-extraction logic SHALL be underscore-safe for table names — it extracts the trailing `<word>_id` field, not the segment after the first underscore.
- FR4: The edit SHALL be applied in place in `003_create_push_rpc.sql`; no new migration file is created.
- FR5: No client code changes; `pushRejectionHandler` continues to soft-delete on `fk_violation:task_id` (`DELETE_FK_FIELDS`).

### Non-Functional

#### Performance

- NFR-P1: The change is a string-literal edit to the reason CASE expression; it SHALL not alter the query plan or transaction behavior of `push_records`.

#### Accessibility

_not applicable — server-side change_

#### Responsive

_not applicable — server-side change_

## UX Acceptance Criteria

- UX1: The user notices no difference except that a checklist item orphaned from its task no longer sticks as a permanent "rejected" record — it self-heals silently like task FK references already do.

## UI States Matrix

_not applicable — no UI affected_

## Behavior

No new user-facing UI. Behavior is verified by an integration test in the existing poison-pill suite (`packages/integration`) asserting the corrected reason string and, end-to-end, that the client soft-heals the orphaned checklist item. The existing `pushRejectionHandler` unit test already covers `fk_violation:task_id → is_deleted`.

## Visual Reference

_not applicable_

## Affected IA

no changes

## Success Metrics

- M1: A `checklist_items` cross-tenant/orphan FK violation returns `fk_violation:task_id` (was `items_task_id`) — covered by an automated integration assertion.
- M2: The three `tasks` FK fields still return their correct `fk_violation:<field>` reasons — covered by the existing cross-tenant assertions.
- M3: The full existing integration suite passes without changing expectations (100%), run once at the end.
- M4: Migration file count in `packages/adapter-supabase/supabase/migrations/` stays at 4.

## Open Questions

_none._
