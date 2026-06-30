# align-daily-to-calendar-rhythm

## Why

Daily fixed frequency currently uses Model A ("from today"): `next_date = today + interval`. This makes it behave identically to `after_completion` with `delay_days = interval`, leaving users with no way to create a calendar-rhythm daily task. Weekly, monthly, and yearly frequencies all use Model B ("by schedule") — advancing from the previous scheduled date with early-completion preservation and skip logic. Daily should follow the same model for consistency and to give users a meaningful distinction between fixed daily and after_completion.

## What Changes

- **MODIFIED**: Daily fixed frequency switches from `today + interval` to calendar-aligned schedule computation (Model B), matching weekly/monthly/yearly behavior
- **MODIFIED**: `nearest-match` mode for daily now returns `today + interval` (respects interval, unlike weekly which uses interval=1)
- **MODIFIED**: `skip-logic.md` rule updated — daily moves from Model A to Model B

## Goals

- G1: Daily fixed frequency uses calendar-aligned computation identical in structure to weekly/monthly/yearly
- G2: Clear semantic distinction between `fixed daily` (calendar rhythm) and `after_completion` (interval from last execution)

## Non-Goals

- NG1: Changing weekly, monthly, or yearly calculation logic
- NG2: Changing `after_completion` logic
- NG3: Changing the UI or adding new repeat rule options
- NG4: Changing the RepeatRule schema or contract types

## Users & Scenarios

- U1: User with a daily habit (e.g., "Morning routine") — task appears every day regardless of when they completed it yesterday
- U2: User inactive for a week — daily task skips missed days and shows only the next future occurrence
- U3: User completes a daily task early (via advance_days) — schedule is preserved, not shifted

## Requirements

### Functional

- FR1: `calculateNextDateDaily` MUST accept `previousNextDate` and `completedAtDate` parameters (like weekly/monthly/yearly) and compute the next date by advancing from `previousNextDate` by `interval` days
- FR2: Early completion (completedAtDate < previousNextDate) MUST preserve the scheduled date — return `previousNextDate` unchanged
- FR3: Skip logic MUST apply when the candidate date (`previousNextDate + interval`) is in the past — skip to the nearest future date aligned to the interval grid, strictly `> today`
- FR4: `resolveNearestMatch` for daily MUST return `today + interval` (not `today + 1`), respecting the user's chosen interval
- FR5: `resolveFromSchedule` for daily MUST delegate to the updated `calculateNextDateDaily` with early-completion and skip logic
- FR6: `skip-logic.md` MUST be updated to move daily from Model A to Model B

### Non-Functional

#### Performance
- NFR-P1: No measurable performance regression in date calculation

## UX Acceptance Criteria

- UX1: Completing a daily task on schedule produces the same result as before (next day for interval=1)
- UX2: Completing a daily task early does not shift the rhythm
- UX3: Returning after inactivity shows only one future occurrence, not a backlog

## State Transition Table

| # | Scenario | Conditions | Result |
|---|----------|------------|--------|
| 1 | On-time completion | interval=1, prev=07-01, completed=07-01, today=07-01 | next=07-02 |
| 2 | Early completion | interval=1, prev=07-02, completed=07-01, today=07-01 | next=07-02 (schedule preserved) |
| 3 | Late by 1 day | interval=1, prev=07-01, completed=07-02, today=07-02 | next=07-03 (skip: 07-02 <= today) |
| 4 | Long inactivity | interval=1, prev=07-01, completed=07-15, today=07-15 | next=07-16 (skip to future) |
| 5 | interval>1, on-time | interval=3, prev=07-01, completed=07-01, today=07-01 | next=07-04 |
| 6 | interval>1, early | interval=3, prev=07-04, completed=07-02, today=07-02 | next=07-04 (schedule preserved) |
| 7 | interval>1, late | interval=3, prev=07-01, completed=07-03, today=07-03 | next=07-04 (candidate > today) |
| 8 | interval>1, inactivity | interval=3, prev=07-01, completed=07-15, today=07-15 | next=07-16 (skip by grid) |
| 9 | nearest-match, interval=1 | rule creation, today=07-01 | next=07-02 |
| 10 | nearest-match, interval>1 | rule creation, interval=3, today=07-01 | next=07-04 |
| 11 | rule change | interval change, today=07-03 | next=today+interval (clean restart) |

## Behavior

Scenarios covered in:
- `packages/client/src/test/features/repeating_tasks/next_date_daily.feature` (updated with new scenarios)
- Existing unit tests: `repeatRule.next-date.test.ts`, `repeatRule.skip-logic.test.ts`

## Visual Reference

No UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: All 11 state transition scenarios have passing BDD tests
- M2: All existing weekly/monthly/yearly tests pass without changes
- M3: Mutation score >= 95% on changed files (minimum acceptable >= 90%)
- M4: `skip-logic.md` updated — daily listed under Model B

## Open Questions

None.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `repeating-tasks`: Daily fixed frequency switches from "from today" (Model A) to "by schedule" (Model B) computation model, gaining early-completion preservation and calendar-aligned skip logic

## Impact

- `packages/client/src/utils/repeatRule.ts` — rewrite of `calculateNextDateDaily`, update of `resolveNearestMatch` and `resolveFromSchedule` for daily
- `packages/client/src/utils/repeatRuleChange.ts` — daily branch in `calculateNextDateOnRuleChange` (if any separate logic exists)
- `.claude/rules/skip-logic.md` — move daily from Model A to Model B
- `docs/adr/` — new ADR documenting all 11 scenarios and the rationale
- Tests: new/updated BDD scenarios and unit tests for daily calendar-aligned behavior
