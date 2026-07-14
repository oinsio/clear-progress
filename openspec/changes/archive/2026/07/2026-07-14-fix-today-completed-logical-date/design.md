# Design: fix-today-completed-logical-date

## Context

Driven by FR1–FR3 from proposal. Current state (`ActiveTasksPage.tsx:145-150`):

```ts
const todayCompleted = useMemo(() => {
  const logicalToday = getLogicalDate(systemClock, getCachedDayBoundary());
  return completedTasks.filter(
    (task) => task.completed_at?.slice(0, 10) === logicalToday,
  );
}, [completedTasks]);
```

`logicalToday` is a local logical date; `completed_at.slice(0, 10)` is a UTC calendar date. The comparison mixes frames of reference. Meanwhile `groupCompletedTasks()` (`shared/lib/utils.ts:19`) already solves the same classification correctly for CompletedPage: it builds `startOfToday` as a `Temporal.Instant` (logical today at `dayBoundary` in the user's timezone) and compares instants.

## Goals / Non-Goals

**Goals:**
- Instant-based "completed today" classification in ActiveTasksPage (FR1)
- One source of truth shared with CompletedPage (FR2)

**Non-Goals:**
- Reactivity to day-boundary setting changes without remount (proposal NG1)
- Any change to `groupCompletedTasks` internals (proposal NG3)

## Decisions

### D1: Reuse `groupCompletedTasks().todayTasks` instead of writing a local instant comparison

```ts
const todayCompleted = useMemo(
  () =>
    groupCompletedTasks(completedTasks, undefined, getCachedDayBoundary())
      .todayTasks,
  [completedTasks],
);
```

**Why**: identical call shape already exists in `CompletedPage.tsx:77-81`, so both pages provably classify the same task the same way (FR2), and the empty-`completed_at` guard (FR3) comes for free (`groupCompletedTasks` routes such tasks to `earlierTasks`).

**Alternative considered**: local `Temporal.Instant.compare(completedInstant, startOfToday) >= 0` filter inside ActiveTasksPage. Rejected — duplicates the boundary math in a second place, and the two pages could drift apart again.

**Trade-off accepted**: `groupCompletedTasks` computes all five groups while we need one. Input is the already-filtered list of completed tasks inside a memo; the extra work is a single O(n) pass with four unused array pushes — negligible (NFR-P1).

### D2: Keep the non-reactive `getCachedDayBoundary()` + `[completedTasks]` deps pattern

Same pattern as CompletedPage. Making dayBoundary reactive is NG1 and would have to change both pages at once — out of scope. The predecessor change's task 1.3 ("add clock and dayBoundary to useMemo dependencies") was never implementable as written: `systemClock` is a constant import and `getCachedDayBoundary()` is a plain function call, neither is a reactive value.

### D3: Tests live in `ActiveTasksPage.completed.test.tsx`, component-level

The bug is in the page's filter wiring, not in `groupCompletedTasks` (which has its own tests). Component tests with mocked `useCompletedTasks` and controlled `completed_at` timestamps pin the wiring. Timezone-sensitive scenarios (delta spec: UTC+5 early morning, UTC-4 evening, custom boundary) require controlling both "now" and the timezone — use the project's `fakeClock` from `@/lib/temporal` (never `vi.setSystemTime`). If `systemClock` inside the page cannot see the fake time, mock `@/hooks/useSettings#getCachedDayBoundary` and `getLogicalDate`'s inputs via module mock of `@/lib/temporal`'s `systemClock` — the existing testSetup already centralizes page mocks; extend it rather than inventing a parallel harness.

## Risks / Trade-offs

- [Component tests can't easily fake the system timezone] → mock `systemClock` at module level via `vi.mock("@/lib/temporal", ...)` re-exporting a `fakeClock("...", "Asia/Almaty")`; verify the RED state (test fails against `slice(0,10)` implementation) before applying the fix, per TDD workflow
- [Behavior change visible to users: early-morning completions previously *left* the section at UTC midnight; now the section follows the logical day] → this is exactly the intended fix (proposal U1/U2); no migration needed, data untouched

## Migration Plan

Pure client-side filter fix — no data, schema, or sync changes. Rollback = revert the commit.

## Open Questions

None.
