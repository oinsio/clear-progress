# Fix completed-today stale on day rollover

## Why

When the app stays open across a day boundary, "today"-relative surfaces freeze on the previous day: the "completed today" section on the Active Tasks page keeps showing yesterday's completed tasks until the user closes/reopens the app or navigates away and back. The logical date is computed imperatively inside `useMemo`/render with no dependency on the passage of time, so nothing forces a recompute when a new day begins. Users who leave the PWA open overnight see incorrect data every morning.

## What Changes

- **ADDED**: a single shared reactive source of the current logical date (`useLogicalToday`, backed by a module-level store consumed via `useSyncExternalStore`, mirroring the existing `menuOrderStore`/`useMenuOrder` pattern). It updates React state exactly when the logical day changes while the app stays mounted.
- **ADDED**: an extracted `scheduleNextBoundary(clock, dayBoundary, onFire)` helper carrying the day-boundary timer math currently inlined in `useHiddenTasksReveal`, reused by both the reveal hook and the new store (single timer per app, ref-counted).
- **MODIFIED**: `ActiveTasksPage` "completed today" section, `CompletedPage` grouping, `TaskItem` completed-at label, `GoalItem` date label, and `TaskDetailsTab` next-date label now recompute/re-render on logical-day change without a remount.
- **ADDED**: an integration test that reproduces the bug (list frozen on yesterday) by advancing a fake clock across the boundary while mounted, then verifies the fix.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `day-boundary`: adds a requirement that "today"-relative displays react to the logical day changing while the app stays mounted (not only on remount), via a shared reactive logical-date source and a single re-armed boundary timer.

## Impact

- **Code**: new `src/stores/logicalTodayStore.ts` + `src/hooks/useLogicalToday.ts`; extracted boundary-timer helper (from `src/hooks/useHiddenTasksReveal.ts`); edits to `src/pages/ActiveTasksPage.tsx`, `src/pages/CompletedPage.tsx`, `src/components/tasks/TaskItem.tsx`, `src/components/goals/GoalItem.tsx`, `src/components/tasks/TaskDetailsTab.tsx`.
- **Behavior**: no data model, sync, or storage changes. No breaking changes. `useHiddenTasksReveal` behavior is preserved (pure refactor of its timer math).
- **Tests**: new integration test crossing the boundary while mounted; unit tests for the store/hook and extracted helper; mutation testing on new logic.

## Goals

- **G1**: When the logical day changes while the app is open, the "completed today" section clears yesterday's tasks within one day-boundary tick (≤ boundary + buffer) — no user action, no remount.
- **G2**: All five "today"-relative display surfaces stay correct across a day boundary without a remount.
- **G3**: Exactly one boundary timer and one set of re-arm listeners exist regardless of how many list items are mounted.

## Non-Goals

- **NG1**: Changing how the logical date itself is computed (`getLogicalDate`) or the day-boundary setting UI.
- **NG2**: Changing the reveal-of-hidden-tasks behavior in `useHiddenTasksReveal` (only its timer math is extracted, behavior unchanged).
- **NG3**: Reactivity for authoring-time date defaults (e.g. `RepeatRuleSelector`, `HideTaskPanel`) — those are not "today" labels and are out of scope.

## Users & Scenarios

- **U1**: A user leaves the PWA open overnight. In the morning, without touching anything, the "completed today" section shows an empty (or newly-started) today, not yesterday's completions.
- **U2**: A user with a custom day boundary (e.g. `04:00`) sees the section roll over at 04:00, not at midnight.
- **U3**: A user returns to a backgrounded tab after the boundary passed; on becoming visible, the "today" surfaces are already correct.

## Requirements

### Functional

- **FR1**: The system SHALL provide a shared reactive current-logical-date source that exposes the logical date (computed via `getLogicalDate` in the user's timezone and day boundary) as React state, updating when the logical day changes while the app stays mounted.
- **FR2**: The reactive source SHALL schedule a single day-boundary timer (via the extracted `scheduleNextBoundary` helper) that self-reschedules, and SHALL re-arm/recompute on `visibilitychange` → visible, `pageshow` (persisted), and `DAY_BOUNDARY_CHANGED_EVENT`.
- **FR3**: `ActiveTasksPage` "completed today" section SHALL recompute when the logical date changes, so tasks completed on the previous logical day leave the section at the boundary without a remount.
- **FR4**: `CompletedPage` grouping SHALL recompute its Today/Yesterday/Week/Month buckets when the logical date changes without a remount.
- **FR5**: `TaskItem` completed-at label ("Completed today/yesterday …") SHALL re-render to the correct label when the logical date changes without a remount.
- **FR6**: `GoalItem` date label ("Today/Yesterday …") SHALL re-render to the correct label when the logical date changes without a remount.
- **FR7**: `TaskDetailsTab` next-date label ("Today/Tomorrow …") SHALL re-render to the correct label when the logical date changes without a remount.
- **FR8**: The day-boundary timer math SHALL be extracted into a reusable helper and reused by `useHiddenTasksReveal` with no change to its observable reveal behavior.

### Non-Functional

#### Performance

- **NFR-P1**: Regardless of the number of mounted list items, the reactive source SHALL maintain at most one boundary timer and one set of global re-arm listeners (module-level store, ref-counted subscriptions).

#### Accessibility

- **NFR-A1**: The rollover update SHALL cause no accessibility regressions; axe-core checks on the affected pages SHALL remain green.

## UX Acceptance Criteria

- **UX1**: With the app open and a completed-today task visible, when the clock crosses the day boundary, the task disappears from the "completed today" section automatically within one boundary tick.
- **UX2**: Yesterday's completed task never reappears in "completed today" after the rollover, even without navigation.
- **UX3**: Custom day boundary is respected — the rollover happens at the configured time, not midnight.

## UI States Matrix

| Network | Data                                       | UI                                                              |
|---------|--------------------------------------------|-----------------------------------------------------------------|
| any     | before boundary, has today-completed tasks | tasks shown in "completed today"                                |
| any     | boundary crosses, no new completions       | "completed today" empty state                                   |
| any     | boundary crosses, list unchanged otherwise | grouping/labels update; other sections unaffected               |
| offline | boundary crosses                           | rollover still occurs (timer is client-side, no network needed) |

## Behavior

See `features/day_boundary_rollover.feature` (tags `@fix-completed-today-stale-on-day-rollover`).

## Affected IA

No changes.

## Success Metrics

- **M1**: An integration test reproduces the bug on the pre-fix code (fails: yesterday's task still shown after the clock crosses the boundary while mounted) and passes after the fix.
- **M2**: After the boundary crosses while mounted, zero previous-logical-day completed tasks remain in the "completed today" section.
- **M3**: Mutation score on new store/hook/helper code ≥ 90% (target ≥ 95%).

## Open Questions

- **Q1**: Timer lifecycle — ref-counted lazy start/stop (start on first subscriber, stop on last) vs. always-on from module load. Leaning ref-counted for cleaner tests and background behavior. Resolved in `design.md`.
