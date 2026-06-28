## Context

Three bugs discovered during a code audit. All related to date computation.

1. **ActiveTasksPage todayCompleted (FR1)**: uses `new Date().toISOString().slice(0,10)` — a UTC date, violating the project rule "NEVER use `new Date()`" and ignoring dayBoundary/timezone. `groupCompletedTasks()` in `shared/lib/utils.ts` already does this correctly via `getLogicalDate(clock, dayBoundary)`.

2. **Weekly interval drift (FR2, FR3)**: `findNextWeekday()` unconditionally jumps `7 * (interval - 1)` days from `startDate`, even when the current week still has matching weekdays. With `weekdays=[1,3], interval=2` the task never appears twice in the same week.

3. **Wrong comments (FR4)**: three dates in skip-logic tests have incorrect day-of-week labels (2026-05-10 labeled Saturday instead of Sunday, 2026-04-18 labeled Friday instead of Saturday, 2026-04-07 labeled Monday instead of Tuesday).

## Goals / Non-Goals

**Goals:**
- Align todayCompleted in ActiveTasksPage with the same pattern as `groupCompletedTasks` (FR1)
- Fix weekly interval semantics: all weekdays in an "active" week fire, then skip (FR2)
- Adapt skip-logic for multi-weekday weekly (FR3)
- Fix comments and add chain tests (FR4)

**Non-Goals:**
- Auto-recalculation of the section on day rollover (NG1)
- Full RFC 5545 compatibility (NG2)

## Decisions

### D1: todayCompleted — reuse getLogicalDate + clock/dayBoundary from context

ActiveTasksPage already has access to `clock` via hooks. Steps:
- Obtain `clock` and `dayBoundary` from existing hooks/contexts (same as CompletedPage does)
- Replace `new Date().toISOString().slice(0,10)` with `getLogicalDate(clock, dayBoundary)`
- Add `logicalToday` to `useMemo` dependencies

**Alternative**: extract filtering into a separate hook. Rejected — excessive abstraction for a single `useMemo`.

### D2: findNextWeekday — split into "within current week" and "jump to next active week"

New `calculateNextDateWeekly` logic:
1. Compute `nextDay = prev + 1`
2. Find all weekdays in the ISO week of `nextDay` that are >= `nextDay`
3. If any exist — return the earliest (no jump)
4. If none — advance to Monday of the next week, jump `(interval - 1) * 7` days, return the first matching weekday

**Alternative**: store "anchor week" in RepeatRule. Rejected — complicates the data model; computing from `previousNextDate` is sufficient.

### D3: Skip-logic for weekly multi-weekday

`periodDays = 7 * interval` remains correct for skip calculation. However, `findNextWeekday` after a skip-jump must also use the new two-step logic (D2) instead of the unconditional `(interval - 1)` jump.

### D4: Tests — chain assertions for multi-weekday

Add a test case with a chain of 6 sequential `calculateNextDate` calls for `weekdays=[1,3], interval=2`. Expected sequence: Mon, Wed (same week), skip, Mon, Wed, skip.

## Risks / Trade-offs

- [Risk] Changing `findNextWeekday` logic may break existing single-weekday cases -> Mitigation: existing tests with `weekdays.length === 1` are unaffected — for a single day the intra-week search always falls through to the jump
- [Risk] Skip-logic tests with wrong comments may codify incorrect expectations -> Mitigation: independently verify each date before updating assert values
