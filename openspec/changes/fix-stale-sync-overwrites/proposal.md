# fix-stale-sync-overwrites

## Why

A multi-device user loses data on recurring tasks: a device that was offline for a while resurrects a completed recurring task with a stale description and deletes the fresh copy on all other devices. Root cause: system-initiated mutations (auto-reveal of hidden tasks, sort-order rebalancing, post-pull deduplication) refresh `updated_at` and set `syncStatus: "pending"` as if the user had edited the record. Under whole-record last-write-wins this makes stale records "newer" than real user edits, and the binary pull protection (`pending` → never overwrite) lets them survive until push, where they win the conflict.

## What Changes

- **MODIFIED**: Auto-reveal of hidden tasks (`HiddenTaskService`) marks records `pending` but no longer refreshes `updated_at` — the timestamp stays at the last real user edit.
- **MODIFIED**: Sort-order rebalancing (`TaskService.rebalanceBox`) marks rebalanced records `pending` but no longer refreshes their `updated_at`; only the task the user actually dragged gets a fresh timestamp.
- **MODIFIED**: Recurring-copy deduplication after pull merges instead of blindly keeping the earliest copy: schedule fields (`next_date` + `appear_date`, always as a pair) come from the copy with the earliest `next_date`, content fields from the copy with the freshest `updated_at`; if `repeat_rule` differs between copies, the freshest copy wins wholesale.
- **MODIFIED**: Pull protection becomes LWW-consistent: a server record overwrites a local `pending` record when the server's `updated_at` is strictly newer; ties and older server records preserve the local record. Conflicts are logged.
- **UNCHANGED (guarded by tests)**: Manual hide and manual unhide-before-appear-date remain real user edits — they refresh `updated_at` and sync to other devices. They apply to non-recurring tasks only (recurring tasks expose no manual hide/unhide controls per `manual-task-hiding`); hidden recurring copies are governed solely by auto-reveal (FR1).
- Specs gain mermaid sequence diagrams for every multi-device sync scenario covered by this change.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `sync-protocol`: "Pull protects local dirty records" changes from status-based (never overwrite `pending`) to LWW-based (overwrite `pending` only when server `updated_at` is strictly newer).
- `repeating-tasks`: "System reveals hidden tasks when appear date arrives" no longer refreshes `updated_at`; "System deduplicates recurring copies after pull" changes from keep-earliest-copy to merge (earliest schedule pair + the freshest content, freshest-wholesale on `repeat_rule` mismatch).
- `manual-task-hiding`: "Hidden tasks auto-reveal on appear date" no longer refreshes `updated_at`; new requirement that manual unhide before the appear date is a synced user edit visible on other devices.
- `tasks`: "Lazy rebalancing when key exceeds threshold" — rebalanced tasks are marked `pending` without an `updated_at` refresh.

## Goals

- G1: The reported scenario (stale device with an auto-revealed recurring copy) converges to the newest user content on all devices — no resurrected completions, no stale descriptions, no deleted fresh copies.
- G2: One invariant across the codebase: system-initiated mutations never refresh `updated_at`; only user actions do.
- G3: Both recurring models (`fixed` schedule and `after_completion`) behave identically before and after the change in single-device flows.

## Non-Goals

- NG1: No server-side changes — conflict resolution on push (`>=` client wins) stays as is.
- NG2: No field-level merge / CRDT — conflict granularity remains whole-record LWW.
- NG3: No clock-skew mitigation between devices.
- NG4: No change to the dedup winner-by-earliest-`next_date` schedule semantics or to skip logic.
- NG5: No UI changes — screens, controls, and UX of hiding/revealing tasks stay untouched.

## Users & Scenarios

- U1: Multi-device user with recurring tasks. Completes and edits a recurring task on device A; device B was offline since before the edits. After device B comes online, both devices show the task with the newest description and correct completion state.
- U2: User who manually hides a task with a future appear date, then manually unhides it early on one device. The task becomes visible on all devices after sync.
- U3: User who drags a task in a large box triggering rebalancing on a stale device. Other tasks in the box do not lose newer content from other devices.

## Requirements

### Functional

- FR1: `HiddenTaskService.revealHiddenTasks()` SHALL set `syncStatus: "pending"` and `is_hidden: false` without modifying `updated_at`. If the record is already `pending`, its state is not degraded.
- FR2: Manual hide and manual unhide (non-recurring tasks — the only kind with manual hide/unhide controls) SHALL remain regular user updates: refresh `updated_at`, set `pending`, clear `appear_date` on unhide — and SHALL propagate to other devices via ordinary push/pull.
- FR3: `RecurringTaskDeduplicator` SHALL merge duplicate groups: the winner record keeps `next_date`, `appear_date`, and `is_hidden` (always as a schedule triple — `is_hidden` is derived from `appear_date`) from the copy with the earliest `next_date` (tiebreak by `id`); content fields (`name`, `description`, `goal_id`, `context_id`, `category_id`) and the pair `box` + `sort_order` (sort keys are per-box) from the copy with the freshest `updated_at`; identity fields (`id`, `created_at`, `revision`) stay the winner's own. When `repeat_rule` differs between copies, the copy with the freshest `updated_at` SHALL win wholesale (all fields including dates). Losers are soft-deleted as today. The merged winner's `updated_at` SHALL be the freshest copy's `updated_at` (not refreshed to now), and the winner SHALL be written with `syncStatus: "pending"` only when the merge actually changed it.
- FR4: `TaskService.rebalanceBox()` SHALL assign new `sort_order` keys and `syncStatus: "pending"` without modifying `updated_at`. `reorderTasks()` SHALL keep refreshing `updated_at` only for the dragged task.
- FR5: `applyServerRecords()` in every entity repository SHALL overwrite a local `pending` record when the server record's `updated_at` is strictly newer than the local one, setting `syncStatus: "synced"`. When local `updated_at` is equal or newer, the local record SHALL be preserved. Each overwrite of a `pending` record SHALL be logged with entity type, id, and both timestamps.
- FR6: Behavior of both recurring models SHALL be preserved: `after_completion` next date derives only from the new `completed_at`; `fixed` keeps early-completion preservation and skip logic. (Regression guard — no recurrence math changes.)

### Non-Functional

#### Reliability

- NFR-REL1: For every scenario in this change's feature files, after both devices complete a push+pull cycle, IndexedDB state on both devices and the server state SHALL be identical (convergence), verified by integration tests.

#### Performance

- Not applicable — no new queries or loops beyond the existing dedup pass.

#### Accessibility

- Not applicable — no UI changes.

#### Responsive

- Not applicable — no UI changes.

## UX Acceptance Criteria

- UX1: The user never observes a completed recurring task returning to active state after a sync.
- UX2: The user never observes a task description reverting to an older version after a sync.
- UX3: A manually unhidden task appears on other devices after their next sync.

## UI States Matrix

No UI changes — existing loading/error/empty/offline states are unaffected.

## Behavior

Scenarios live in feature files tagged `@fix-stale-sync-overwrites @FR-X`:

- `packages/client/src/test/features/sync_protocol/stale_reveal_sync.feature` — FR1, FR2 (unit BDD, vitest-cucumber)
- `packages/client/src/test/features/repeating_tasks/dedup_merge.feature` — FR3, FR6 (unit BDD)
- `packages/client/src/test/features/sync_protocol/rebalance_sync.feature` — FR4 (unit BDD)
- `packages/client/src/test/features/sync_protocol/pull_lww_protection.feature` — FR5 (unit BDD)
- Integration tests (`packages/integration`) simulate two devices against a real backend for the U1/U2/U3 scenarios and the NFR-REL1 convergence check.

## Visual Reference

Not applicable — no UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: The reported two-device scenario, reproduced as an integration test, passes: final description on both devices equals the latest user edit, and the completed occurrence stays completed.
- M2: Zero `pending` records whose `updated_at` was written by a code path other than a user action (verified by unit tests on reveal, rebalance, dedup).
- M3: Mutation score on changed files >= 95% (minimum acceptable 90%).

## Open Questions

(none — tie semantics, clock skew, and server behavior were explicitly scoped out in NG1-NG3)
