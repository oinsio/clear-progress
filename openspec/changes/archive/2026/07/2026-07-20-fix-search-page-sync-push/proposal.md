# fix-search-page-sync-push

## Why

`SearchPage.tsx` performs local data mutations — complete/uncomplete, edit, move, delete, duplicate tasks; edit, delete ideas — without ever calling `schedulePush()`. The `sync-orchestration` spec (T3) states that after **any** local data mutation `schedulePush()` is called, and every other page/hook complies (`useTasks`, `useInboxTasks`, `useGoals`, `useIdeas`, `useChecklist`, …). A change made from the search page therefore reaches the server only when some *other* event happens to trigger a push (a mutation on another page, or the next periodic sync). If the user closes the app right after acting from search, the server and other devices stay stale until the next app session. Discovered during the impact scan for `fix-recurring-completion-error-masking` (recorded in its task 1.1 findings); kept as a separate change because it covers all SearchPage mutations, not just completion.

## What Changes

- **MODIFIED**: `SearchPage.tsx` obtains `schedulePush` from `useSync()` and calls it after each successful mutation in all seven handlers: `handleCompleteTask` (both the `complete` and `noncomplete` branches), `handleUpdateTask`, `handleMoveTask`, `handleTaskDelete`, `handleTaskDuplicate`, `handleIdeaUpdate`, `handleIdeaDelete`.
- **UNCHANGED**: search behavior itself (`useSearch`, debounce, result rendering), the mutation services, and the sync protocol/debounce (`SYNC_DEBOUNCE_MS`) are untouched.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `search`: new requirement — mutations initiated from the search page SHALL schedule a background push, consistent with `sync-orchestration` T3. (T3 itself is unchanged; the search capability gains the explicit page-level requirement that was silently violated.)

## Goals

- G1: Every mutation initiated from the search page schedules a push, exactly like the same mutation performed from any other page.
- G2: No other observable behavior of the search page changes — results, debounce, detail panels, and the mutations themselves are byte-for-byte identical.

## Non-Goals

- NG1: No refactor of `SearchPage` onto the shared mutation hooks (`useTasks`/`useTaskMutations`) — its direct `defaultTaskService`/`defaultIdeaService` calls remain; only push scheduling is added. (A deeper unification is a separate initiative; completion alerting from search is already covered by `fix-recurring-completion-error-masking` FR6.)
- NG2: No change to the sync protocol, debounce interval, or `SyncProvider` internals.
- NG3: No new UI (no sync toast/indicator specific to search) — the existing global sync indicator already reflects scheduled pushes.

## Users & Scenarios

- U1: A user completes a task from search results and puts the phone away. The push is scheduled immediately (fires after the standard debounce), so the server and their other devices receive the change in the same timeframe as a completion made from Inbox — not "whenever something else happens to sync".
- U2: A user edits an idea found via search. The edit syncs on the normal schedule without requiring any further activity in the app.

## Requirements

### Functional

- FR1: `SearchPage` SHALL call `schedulePush()` after each successful task mutation: `complete`, `noncomplete`, `update`, `moveToBox`, `softDelete`, `duplicate`.
- FR2: `SearchPage` SHALL call `schedulePush()` after each successful idea mutation: `update`, `softDelete`.
- FR3: `schedulePush` SHALL be obtained via `useSync()` (the same provider mechanism every other page uses), not imported or reimplemented ad hoc.

### Non-Functional

#### Performance

- Not applicable — `schedulePush()` is already debounced (`SYNC_DEBOUNCE_MS`); repeated mutations from search coalesce into one sync cycle exactly as elsewhere.

#### Accessibility

- Not applicable — no UI change.

#### Responsive

- Not applicable — no layout change.

## UX Acceptance Criteria

- UX1: No visible UI change on the search page itself; after a mutation from search, the global sync behavior (indicator, timing) matches the same mutation performed from any other page.

## UI States Matrix

No changes — no new states; the search page's loading/empty/error states are untouched.

## Behavior

Scenarios live in `packages/client/src/test/features/search/search_mutations_schedule_push.feature` tagged `@fix-search-page-sync-push @FR1` / `@FR2` (unit BDD, vitest-cucumber): completing / editing / moving / deleting / duplicating a task from search schedules a push; editing / deleting an idea from search schedules a push.

## Visual Reference

Not applicable — no UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: Unit tests prove each of the 8 mutation paths (6 task + 2 idea) triggers exactly one `schedulePush()` call.
- M2: Grep over `SearchPage.tsx` shows every handler that awaits a `defaultTaskService`/`defaultIdeaService` mutation also calls `schedulePush` — zero non-compliant handlers remain.
- M3: Mutation score on the changed handlers >= 95% (minimum acceptable 90%).

## Open Questions

- Q1: Should `SearchPage` eventually reuse the shared mutation hooks instead of calling services directly (removing this class of drift for good)? Out of scope (NG1); revisit after `fix-recurring-completion-error-masking` lands its shared completion-alert helper.

## Impact

- `packages/client/src/pages/SearchPage.tsx` — the only production file changed.
- New/updated unit tests for `SearchPage` mutation handlers; new BDD feature file.
- Delta spec for the `search` capability.
