# dedup-recurring-after-pull

## Why

When two devices complete the same recurring task while offline, each creates a copy with its own UUID. After both push, the server holds two identical future occurrences. `findHiddenRecurringTask` only checks local IndexedDB — it cannot detect copies created on other devices. `revealHiddenTasks` reveals all copies with matching `appear_date`, making both visible. Each subsequent completion doubles the chain.

Integration test 5.13.3 explicitly allows this: `expect(occurrences.length).toBeGreaterThanOrEqual(1)` — the problem is known but unresolved.

In a personal app with phone + desktop, "completed on one device, not synced, opened on another" is a realistic daily scenario. Duplicates accumulate and require manual cleanup.

## What Changes

- **ADDED**: Client-side deduplication of recurring task copies after pull
- **MODIFIED**: Integration test 5.13.3 assertion tightened to `=== 1`

## Goals

- G1: After sync convergence, exactly one active future occurrence exists per recurring chain
- G2: Deduplication is deterministic — both devices pick the same winner without coordination

## Non-Goals

- NG1: Server-side unique constraint on `original_task_id` — complex with chunked push and offline
- NG2: Preventing duplicate creation at `complete()` time — requires server round-trip, breaks offline
- NG3: Deterministic UUID generation for recurring copies — invasive change to ID strategy

## Users & Scenarios

- U1: User completes daily task on phone (offline), then completes same task on desktop (offline). Both devices sync. After convergence, only one future occurrence remains.
- U2: User completes a recurring task on one device, syncs, and the other device pulls. No duplicates appear (existing `findHiddenRecurringTask` flow, already works).

## Requirements

### Functional

- FR1: After applying a pull batch, the system SHALL detect duplicate recurring copies — multiple non-completed, non-deleted tasks sharing the same `original_task_id`
- FR2: Among duplicates, the system SHALL keep the winner determined by: earliest `next_date`, then lexicographically smallest `id` as tiebreaker. All other duplicates SHALL be soft-deleted with `syncStatus: "pending"`
- FR3: Soft-deleting a duplicate SHALL cascade to its checklist items (set `is_deleted: true`, `syncStatus: "pending"`, `updated_at` to current timestamp)
- FR4: Deduplication SHALL run after pull batch is applied but BEFORE the `sync_complete` event is dispatched, so that `revealHiddenTasks` sees clean data
- FR5: Deduplication SHALL be skipped when the pull batch contains no tasks with non-empty `original_task_id` (performance optimization)
- FR6: Integration test 5.13.3 SHALL assert exactly 1 active non-completed occurrence after both devices sync

### Non-Functional

#### Performance

- NFR-P1: Deduplication scan SHALL only query tasks when the pull batch included tasks with `original_task_id != ""` — no overhead on normal pulls without recurring data

## UX Acceptance Criteria

- UX1: The user never sees duplicate recurring tasks in any box after sync completes
- UX2: No user interaction required — deduplication is fully automatic and silent

## Success Metrics

- M1: Integration test 5.13.3 passes with `toHaveLength(1)` instead of `toBeGreaterThanOrEqual(1)`
- M2: Unit tests cover: two duplicates with same `next_date` (tiebreak by id), two duplicates with different `next_date` (earlier wins), no duplicates (no-op), cascade to checklist items
- M3: Mutation testing score >= 95% on deduplication logic

## Behavior

Scenarios covered in BDD unit tests (`packages/client/src/test/features/repeating_tasks/dedup_after_pull.feature`).

## Affected IA

No IA changes.

## Open Questions

No open questions — approach validated during explore phase.
