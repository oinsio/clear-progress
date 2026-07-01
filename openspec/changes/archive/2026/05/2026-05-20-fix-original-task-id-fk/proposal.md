# fix-original-task-id-fk

## Why

Push sync fails with 500 Internal Server Error when sending a recurring task clone if the original task does not yet exist on the server. The FK constraint `tasks_original_task_id_fkey` is violated because incremental sync only sends dirty records — the original may have been synced earlier or may not yet be in the payload.

In the client-first architecture, the server does not interpret `original_task_id` — it is a purely client-side field for linking recurring task clone chains. A self-referencing FK constraint within the same table is incompatible with incremental sync.

## What Changes

- **MODIFIED**: Remove FK constraint from the `original_task_id` column in the `tasks` table. The column remains as `UUID` but without `REFERENCES tasks(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED`.
- **MODIFIED**: Update the `supabase-schema` spec — remove FK from the `original_task_id` description.

## Goals

- G1: Push sync of tasks with `original_task_id` does not cause FK violation errors.
- G2: `original_task_id` data is correctly stored and returned during push/pull.

## Non-Goals

- NG1: Changing client-side logic for `original_task_id` (chain creation, hidden clone lookup, chain restructuring on delete).
- NG2: Adding server-side validation of `original_task_id`.
- NG3: Removing other FK constraints (goal_id, context_id, category_id) — they work correctly thanks to dependency order.

## Users & Scenarios

- U1: User completes a recurring task → a clone with `original_task_id` is created → on the next sync the clone is successfully pushed to the server, even if the original is not yet on the server.

## Requirements

### Functional

- FR1: The `original_task_id` column in the `tasks` table MUST NOT have a FK constraint.
- FR2: The `original_task_id` column MUST remain of type `UUID` (nullable).
- FR3: Pushing a task with `original_task_id` pointing to a task that does not exist on the server MUST succeed.
- FR4: Pushing a task with `original_task_id` pointing to an existing task MUST preserve the value correctly.
- FR5: Pull MUST return `original_task_id` in the same format (UUID string or empty string).

### Non-Functional

#### Performance

- NFR-P1: Removing the FK MUST NOT degrade push/pull operation performance.

## UX Acceptance Criteria

- UX1: Recurring tasks sync without errors — the user sees no sync failures.

## Behavior

No user-facing behavior changes — this is an infrastructure fix.

## Visual Reference

No UI changes.

## Affected IA

No changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `supabase-schema`: Remove FK constraint from `tasks.original_task_id` in the schema description.

## Success Metrics

- M1: Push of a task with `original_task_id` referencing a non-existent task: HTTP 200 (was 500).
- M2: All existing sync integration tests pass without changes.

## Open Questions

None.
