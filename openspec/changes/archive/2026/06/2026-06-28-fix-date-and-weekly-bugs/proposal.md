# fix-date-and-weekly-bugs

## Why

Three bugs undermine date correctness in the app: the "completed today" section uses UTC instead of the logical date, weekly schedules with interval > 1 and multiple weekdays drift (a task never fires twice in the same week), and skip-logic tests contain wrong day-of-week comments that mask the incorrect behavior.

## What Changes

- **FIX**: `ActiveTasksPage.tsx` — replace `new Date().toISOString().slice(0,10)` with `getLogicalDate(clock, dayBoundary)` for todayCompleted filtering
- **FIX**: `repeatRule.ts` — rework `findNextWeekday()` and `calculateNextDateWeekly()` for correct interval semantics (interval applies to weeks, not to transitions between individual days)
- **FIX**: `repeatRule.skip-logic.test.ts` — fix incorrect day-of-week comments and add tests for multi-weekday + interval > 1

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `day-boundary`: todayCompleted filtering in ActiveTasksPage must use getLogicalDate instead of UTC
- `repeating-tasks`: weekly interval with multiple weekdays must fire all days within the "active" week before skipping

## Goals

- G1: "Completed today" section shows correct tasks regardless of user timezone
- G2: Weekly schedule with interval > 1 and multiple weekdays follows RRULE INTERVAL+BYDAY semantics

## Non-Goals

- NG1: Auto-recalculation of the section on day rollover while app is open (separate task)
- NG2: Full RFC 5545 RRULE compatibility

## Users & Scenarios

- U1: User in UTC+5 (Almaty) completes a task between 00:00-05:00 local time — the task must appear in "completed today"
- U2: User creates a task "every 2 weeks on Mon and Wed" — both days fire in the same week, then skip

## Requirements

### Functional

- FR1: todayCompleted filtering in ActiveTasksPage MUST use `getLogicalDate(clock, dayBoundary)` to determine "today"
- FR2: `calculateNextDateWeekly` with multiple weekdays MUST exhaust all matching days in the current week first, then jump `interval` weeks from the start of the next week
- FR3: Skip-logic for weekly with interval > 1 and multiple weekdays MUST correctly align to "active" weeks
- FR4: Day-of-week comments in skip-logic tests MUST match the actual days of the specified dates

### Non-Functional

#### Performance

- NFR-P1: No additional renders — `useMemo` dependencies update only when data changes

#### Accessibility

_(no changes)_

#### Responsive

_(no changes)_

## UX Acceptance Criteria

- UX1: "Completed today" section displays tasks completed during the user's current logical day

## Behavior

Covered by unit tests:
- `ActiveTasksPage.completed.test.tsx` — FR1
- `repeatRule.test.ts` / `repeatRule.skip-logic.test.ts` — FR2, FR3, FR4

## Visual Reference

_(no UI changes)_

## Affected IA

No changes.

## Success Metrics

- M1: All existing tests pass after refactoring
- M2: A chain of 6 sequential completions with weekly interval=2 weekdays=[1,3] produces the correct date sequence (Mon, Wed of the same week, skip, Mon, Wed of the next active week)
- M3: Mutation score >= 95% on changed files

## Open Questions

_(none)_
