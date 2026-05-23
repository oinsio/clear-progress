# cascade-checklist-delete

## Why

When a task is soft-deleted, its checklist_items are not cascaded. After purge, the task is physically removed from IndexedDB while its checklist items remain as "orphans". During the first sync with Supabase, orphans cause an FK violation (`checklist_items_task_id_fkey`), blocking push.

## What Changes

- **ADDED**: Cascading soft-delete of checklist_items when a task is deleted
- **ADDED**: Cascading restore of checklist_items when a task is restored
- **ADDED**: Self-healing mechanism before push to detect and remove orphans

## Goals

- G1: Eliminate FK violation when pushing checklist_items referencing a non-existent task
- G2: Ensure data integrity between tasks and checklist_items

## Non-Goals

- NG1: Server-side cascade enforcement (may cause unexpected behavior during cross-device sync)
- NG2: Post-pull integrity check (redundant given client-side cascade and self-healing)
- NG3: Cascade for other FK relationships (goal_id, context_id, category_id use `ON DELETE SET NULL`)

## Users & Scenarios

- U1: User deletes a task with a checklist and then syncs — expects checklist items to be deleted too
- U2: User restores a deleted task — expects the entire checklist to come back
- U3: User with corrupted data (orphans after a bug/migration) — expects push not to fail

## Requirements

### Functional

- FR1: When `softDelete(taskId)` is called, all checklist_items of that task SHALL have `is_deleted = true`, `needsSync = true`, and updated `updated_at`
- FR2: When `restore(taskId)` is called, ALL checklist_items of that task (including previously manually deleted ones) SHALL have `is_deleted = false`, `needsSync = true`, and updated `updated_at`
- FR3: Before building push data, the system SHALL check each checklist_item: if its `task_id` references a task that does not physically exist in IndexedDB, that checklist_item SHALL be hard-deleted from IndexedDB and excluded from push
- FR4: ChecklistRepository SHALL provide a `getByTaskId(taskId)` method to retrieve all checklist_items of a task

### Non-Functional

#### Performance

- NFR-P1: Self-healing check SHALL use batch lookup (`db.tasks.bulkGet`) to minimize IndexedDB queries
- NFR-P2: Cascading soft-delete/restore SHALL execute within a single Dexie transaction alongside the task update

## UX Acceptance Criteria

- UX1: When a task is deleted, its checklist disappears from the UI without additional user action
- UX2: When a task is restored, the entire checklist is restored (including previously manually deleted items)
- UX3: Self-healing is transparent to the user — orphans are removed silently with console.warn logging

## Behavior

Scenarios are described in the delta spec for `sync-protocol`.

## Affected IA

No changes to IA.

## Success Metrics

- M1: Push with checklist_items no longer returns FK violation
- M2: After softDelete(task) + purge, no checklist_items with the deleted task's task_id remain in IndexedDB
- M3: Mutation testing score >= 95% on changed code

## Open Questions

- Q1: (Resolved) Restore recovers ALL checklist_items, including manually deleted ones — accepted
- Q2: (Resolved) Self-healing hard-deletes orphans (not soft-delete) — accepted, since orphans cannot be sent to the server

## Capabilities

### New Capabilities

(no new capabilities — changes are within existing ones)

### Modified Capabilities

- `sync-protocol`: Add cascading soft-delete/restore requirements for checklist_items (FR1, FR2) and self-healing before push (FR3)
