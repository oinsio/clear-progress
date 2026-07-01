# fix-recurring-restore

## Why

Restoring a soft-deleted recurring task from the Deleted page creates two independent recurrence chains. `softDelete()` promotes a copy to be the new chain original (`original_task_id: ""`), but `restore()` simply clears `is_deleted` without knowing about the promotion. The restored task keeps its `repeat_rule` and empty `original_task_id` — producing two independent originals. Completing either one creates its own copy, and duplicates grow from that point on.

Deleting a recurring task and undoing it via the Deleted page is a standard user flow that the app explicitly offers.

## What Changes

- **MODIFIED**: `softDelete()` — on promotion, records the promoted copy's ID in the deleted task's `original_task_id`, preserving the link for a potential restore
- **MODIFIED**: `restore()` — checks whether a promotion occurred (via `original_task_id` + `repeat_rule`) and conditionally clears `repeat_rule` or restores as a chain original

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `repeating-tasks`: adds restore scenarios for recurring tasks — `softDelete` and `restore` behavior when promotion occurred
- `deleted-entities`: refines restore behavior for recurring tasks

## Impact

- `packages/client/src/services/TaskService.ts` — `softDelete()` and `restore()`
- New test file `TaskService.recurring-restore.test.ts`
- Not affected: data model (no new fields), sync protocol, UI

## Goals

- G1: Eliminate the duplicate-chain bug when restoring a recurring task
- G2: Cover all restore scenarios for recurring tasks with tests

## Non-Goals

- NG1: Changing the Deleted page UI (e.g., notifications about repeat_rule removal)
- NG2: Changing the data model or sync protocol
- NG3: Refactoring existing softDelete/complete logic

## Users & Scenarios

- U1: User deletes a daily task, changes their mind, restores from Deleted page — task returns without repeat_rule (chain stays with the promoted successor)
- U2: User deletes a recurring task, promoted successor is also deleted — task restores as a chain original with repeat_rule intact
- U3: User deletes a non-recurring task — behavior is unchanged

## Requirements

### Functional

- FR1: On `softDelete()` with promotion — record the promoted copy's ID in the deleted task's `original_task_id` before marking `is_deleted: true`
- FR2: On `restore()` — if the task has non-empty `original_task_id` and non-empty `repeat_rule`, check the promoted successor's state
- FR3: If the promoted successor is alive (not deleted) — clear `repeat_rule`, `next_date`, `appear_date` on the restored task
- FR4: If the promoted successor is deleted or does not exist — restore the task as a chain original (`original_task_id: ""`)
- FR5: If the task has no `repeat_rule` or `original_task_id` is empty — restore without changes (current behavior)

### Non-Functional

_None._

## UX Acceptance Criteria

- UX1: Restoring a recurring task does not create duplicate recurrence chains
- UX2: Restoring a non-recurring task behavior is unchanged

## State Transition Diagram

```
                          softDelete (with copies)
    ┌──────────────┐  ─────────────────────────────▶   ┌──────────────────┐
    │   ACTIVE     │                                   │  DELETED         │
    │   ORIGINAL   │                                   │  (orig_id=B.id)  │
    │  orig_id=""  │                                   │  repeat_rule=✓   │
    │  repeat=✓    │  ◀──── restore (B deleted) ─────  │                  │
    └──────────────┘         FR4: clear orig_id        └────────┬─────────┘
                                                                │
                                                    restore (B alive)
                                                    FR3: clear repeat
                                                                │
                                                                ▼
                                                   ┌──────────────────┐
                                                   │  ACTIVE          │
                                                   │  NON-RECURRING   │
                                                   │  orig_id="B"     │
                                                   │  repeat=""       │
                                                   └──────────────────┘
```

## State Table: restore() Decision Matrix

| original_task_id | repeat_rule | Promoted successor state                  | Action                                         | Result                                 |
|------------------|-------------|-------------------------------------------|------------------------------------------------|----------------------------------------|
| `""`             | `""`        | N/A                                       | FR5: no changes                                | Regular task restored                  |
| `""`             | `"daily"`   | N/A                                       | FR5: no changes                                | Original without promotion restored    |
| `"B"`            | `""`        | N/A                                       | FR5: no changes                                | Non-recurring copy restored            |
| `"B"`            | `"daily"`   | Active (is_deleted=false)                 | FR3: clear repeat_rule, next_date, appear_date | Non-recurring task, chain stays with B |
| `"B"`            | `"daily"`   | Deleted (is_deleted=true)                 | FR4: clear original_task_id                    | Original with repeat_rule restored     |
| `"B"`            | `"daily"`   | Does not exist                            | FR4: clear original_task_id                    | Original with repeat_rule restored     |
| `"B"`            | `"daily"`   | Hidden (is_hidden=true, is_deleted=false) | FR3: clear repeat_rule, next_date, appear_date | Non-recurring task, chain stays with B |

## Behavior

Behavior is defined in delta specs for `repeating-tasks` and `deleted-entities`.

## Visual Reference

No UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: All 6 scenarios from the explore session are covered by unit tests and pass
- M2: Mutation score >=95% on changed files
- M3: Existing softDelete and recurring tests are not broken

## Open Questions

_None._
