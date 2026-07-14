# fix-today-completed-logical-date

Supersedes: fix-date-and-weekly-bugs (FR1 — the fix was incomplete)

## Why

The "Completed today" section in ActiveTasksPage compares a timezone-aware logical date (`getLogicalDate`) against a UTC date slice of `completed_at` (`task.completed_at?.slice(0, 10)`). The two sides live in different frames of reference, so whenever the local calendar date differs from the UTC date at completion time, the task never appears in "Completed today". The predecessor change `fix-date-and-weekly-bugs` fixed only the "today" side of the comparison (FR1) and its promised regression test was never added; its own scenario U1 (user in UTC+5 completes a task between 00:00–05:00 local) still fails — and now fails harder than before the fix (the task used to show until 05:00, now it never shows).

## What Changes

- **FIX**: `ActiveTasksPage.tsx` — replace the manual `completed_at.slice(0, 10) === logicalToday` filter with `groupCompletedTasks(completedTasks, systemClock, getCachedDayBoundary()).todayTasks`, the instant-based grouping already used by CompletedPage (`shared/lib/utils.ts`)
- **ADDED**: regression tests for todayCompleted in non-UTC timezones and with a custom day boundary — the RED test promised by `fix-date-and-weekly-bugs` task 1.1 that never landed

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `day-boundary`: the todayCompleted filter requirement changes — the completion day of a task MUST be derived from the `completed_at` instant in the user's timezone with the day boundary applied (instant comparison against start-of-logical-day), never from a UTC string slice

## Impact

- `packages/client/src/pages/ActiveTasksPage.tsx` — todayCompleted useMemo
- `packages/client/src/pages/ActiveTasksPage.completed.test.tsx` — new timezone/day-boundary tests
- No API, schema, or dependency changes; `groupCompletedTasks` is reused as-is

## Goals

- G1: A task completed "today" in the user's logical day (timezone + day boundary) appears in "Completed today" regardless of the UTC date of its `completed_at`
- G2: ActiveTasksPage and CompletedPage classify the same task into "today" identically (single source of truth: `groupCompletedTasks`)

## Non-Goals

- NG1: Making the section reactive to day-boundary setting changes without remount — CompletedPage has the same non-reactive `getCachedDayBoundary()` pattern; changing it is a separate initiative
- NG2: Auto-recalculation of the section on day rollover while the app is open (explicitly excluded by fix-date-and-weekly-bugs NG1 as well)
- NG3: Any changes to `groupCompletedTasks` itself — it is already correct

## Users & Scenarios

- U1: User in UTC+5 (Almaty) completes a task at 02:00 local — `completed_at` is 21:00 UTC of the previous day; the task MUST appear in "Completed today"
- U2: User in UTC-4 (New York, summer) completes a task at 21:00 local — `completed_at` is 01:00 UTC of the next day; the task MUST appear in "Completed today" immediately
- U3: User with day boundary "04:00" completes a task at 01:30 local — the completion belongs to the previous logical day; the task MUST appear in "Completed today" (both sides shift together)

## Requirements

### Functional

- FR1: todayCompleted in ActiveTasksPage MUST classify tasks by comparing the `completed_at` instant against the start of the logical day (logical today at `dayBoundary` in the user's timezone), not by comparing date strings
- FR2: todayCompleted MUST reuse `groupCompletedTasks().todayTasks` so ActiveTasksPage and CompletedPage cannot diverge
- FR3: Tasks with empty `completed_at` MUST NOT appear in "Completed today" (preserved behavior)

### Non-Functional

#### Performance

- NFR-P1: The filter stays inside `useMemo` keyed on `completedTasks` — no additional renders versus the current implementation

#### Accessibility

_(no changes — list rendering is untouched)_

#### Responsive

_(no changes)_

## UX Acceptance Criteria

- UX1: Completing a task at any local time of the user's logical day shows it in "Completed today" without reload, in every timezone

## UI States Matrix

No changes — the section already renders only when non-empty; empty/loading/error handling is untouched.

## Behavior

Scenarios are covered by unit tests in `ActiveTasksPage.completed.test.tsx` (component-level, fakeClock-driven); no new Gherkin feature — this is a correctness fix inside an existing behavior, consistent with the predecessor change.

## Visual Reference

No visual changes.

## Affected IA

No changes.

## Success Metrics

- M1: New regression tests (U1, U2, U3 scenarios) pass; the same tests fail against the current implementation (RED verified before GREEN)
- M2: All existing ActiveTasksPage and shared/lib tests keep passing
- M3: Mutation score for the changed filter code >= 95%

## Open Questions

- Q1: none
