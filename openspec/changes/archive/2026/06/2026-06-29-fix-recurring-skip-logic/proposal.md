# fix-recurring-skip-logic

## Why

Skip logic for recurring tasks has two bugs and a documentation error:

1. **Daily calculates from schedule, not from today.** When a user completes a daily task after being inactive, the next date is calculated as `prev + ceil(days/interval) * interval`, which can land on today. The user expects `today + interval` because they already did the task today.

2. **Inconsistent "today" boundary across frequencies.** Monthly uses `<= 0` (today is "already passed"), while daily/weekly/yearly use `< 0` (today is "still valid"). All schedule-based frequencies (weekly/monthly/yearly) should use the same rule: nearest scheduled date **strictly after today**.

3. **ADR-0002 daily example describes a non-existent two-step algorithm.** The document claims `periodsToSkip = 7 -> next = 2026-04-17`, but the code produces `periodsToSkip = 6 -> next = 2026-04-16`. No daily skip test exists to catch this.

## What Changes

- **MODIFIED**: `calculateNextDateDaily` — compute `today + interval` instead of schedule-aligned skip
- **MODIFIED**: `calculateNextDateYearly` — change boundary from `< 0` to `<= 0` (align with monthly: strictly after today)
- **MODIFIED**: ADR-0002 — fix daily example, document two computation models
- **MODIFIED**: skip-logic rule (`.claude/rules/skip-logic.md`) — document the two models
- **ADDED**: daily skip tests in `repeatRule.skip-logic.test.ts`

## Goals

- G1: All frequencies return a date strictly after today when completing a task
- G2: Daily frequency computes next date from completion date, not from schedule
- G3: ADR-0002 accurately describes the implemented algorithm
- G4: All skip-logic edge cases are covered by tests

## Non-Goals

- NG1: Changing `after_completion` behavior (already correct: `completedAt + delay_days`)
- NG2: Changing weekly skip logic (already correct: nearest weekday strictly after today)
- NG3: Changing monthly `<= 0` boundary (already matches user expectation)
- NG4: Changing end-of-month clamping logic (already correct: `min(day, daysInMonth)`)

## Users & Scenarios

- U1: User with daily task (interval=1), inactive 6 days, completes old task — expects next task **tomorrow**, not today
- U2: User with daily task (interval=3), inactive 10 days, completes old task — expects next task in **3 days from today**, not in 2 days
- U3: User with yearly task (March 15), completes on March 15 — expects next task **next year**, not today
- U4: User with daily task, completes early via advance_days — expects next task **tomorrow**, not on originally scheduled date

## Requirements

### Functional

- FR1: `calculateNextDateDaily` MUST return `today + interval` when previous next_date is on or before today (skip scenario and normal completion)
- FR2: `calculateNextDateDaily` MUST return `previousNextDate + interval` when previous next_date is after today (early completion of advance_days task where next_date hasn't arrived — but see FR1 override in U4, daily always uses today + interval)
- FR3: `calculateNextDateYearly` MUST return a date strictly after today (change boundary from `< 0` to `<= 0`)
- FR4: ADR-0002 MUST accurately reflect the two computation models: "from today" (daily, after_completion) and "by schedule" (weekly, monthly, yearly)
- FR5: Daily skip-logic MUST be covered by at least 3 test cases: interval=1 with skip, interval=3 with skip, early completion via advance_days

### Non-Functional

#### Performance
- NFR-P1: No performance change — same O(1) computation

## UX Acceptance Criteria

- UX1: After completing a daily task, the next copy never appears on the same day

## Behavior

Two computation models for `calculateNextDate`:

### Model A: "From today" (daily, after_completion)

```
next_date = today + interval
```

Ignores the original schedule. The user did the task today, the next one is N days from now.

### Model B: "By schedule, strictly after today" (weekly, monthly, yearly)

```
next_date = nearest scheduled date > today
```

Finds the next occurrence from the fixed schedule that hasn't happened yet. The interval rhythm is preserved from the original schedule (e.g., biweekly cadence counts from prev, not from today).

### Scenario table (all frequencies)

| #  | Frequency | Schedule          | prev       | today      | Expected   | Model                     |
|----|-----------|-------------------|------------|------------|------------|---------------------------|
| 1  | daily/1   | every day         | 2026-04-10 | 2026-04-16 | 2026-04-17 | A: today+1                |
| 2  | daily/3   | every 3 days      | 2026-04-10 | 2026-04-20 | 2026-04-23 | A: today+3                |
| 3  | weekly/1  | Mon               | 2026-04-20 | 2026-05-10 | 2026-05-11 | B: nearest Mon > today    |
| 4  | weekly/1  | Mon,Wed,Fri       | 2026-04-18 | 2026-05-10 | 2026-05-11 | B: nearest day > today    |
| 5  | weekly/2  | Mon every 2 weeks | 2026-06-22 | 2026-06-29 | 2026-07-06 | B: rhythm from prev       |
| 6  | monthly/1 | 1st of month      | 2026-01-01 | 2026-07-01 | 2026-08-01 | B: nearest 1st > today    |
| 7  | monthly/1 | 15th of month     | 2026-01-15 | 2026-07-01 | 2026-07-15 | B: nearest 15th > today   |
| 8  | yearly/1  | March 15          | 2024-03-15 | 2026-03-15 | 2027-03-15 | B: nearest Mar 15 > today |
| 9  | daily/1   | every day (early) | 2026-07-05 | 2026-07-03 | 2026-07-04 | A: today+1                |
| 10 | weekly/1  | Mon (early)       | 2026-07-06 | 2026-07-04 | 2026-07-06 | B: nearest Mon > today    |
| 11 | monthly/1 | 15th (early)      | 2026-07-15 | 2026-07-12 | 2026-07-15 | B: nearest 15th > today   |
| 12 | after/7   | 7 days after done | 2026-04-10 | 2026-04-20 | 2026-04-27 | A: today+7                |

### End-of-month clamping (no changes needed)

Rule: `min(day_of_month, daysInMonth)`. Original day_of_month is preserved in the rule; clamping is per-month adaptation only.

| day_of_month | Target month             | Days in month | Result                 |
|--------------|--------------------------|---------------|------------------------|
| 31           | February 2026            | 28            | 28                     |
| 30           | February 2026            | 28            | 28                     |
| 29           | February 2026 (non-leap) | 28            | 28                     |
| 31           | March 2026               | 31            | 31 (restores original) |
| 29           | February 2028 (leap)     | 29            | 29 (restores original) |

### Yearly Feb 29 in non-leap year

Same clamping rule. Task for Feb 29 appears as Feb 28 in non-leap years, restores to Feb 29 in leap years.

| month_and_day | Target year | Leap? | Result     |
|---------------|-------------|-------|------------|
| {2, 29}       | 2025        | No    | 2025-02-28 |
| {2, 29}       | 2026        | No    | 2026-02-28 |
| {2, 29}       | 2027        | No    | 2027-02-28 |
| {2, 29}       | 2028        | Yes   | 2028-02-29 |

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `repeating-tasks`: Daily skip logic changes from schedule-based to today-based computation; yearly boundary changes from `< 0` to `<= 0`

## Impact

- `packages/client/src/utils/repeatRule.ts` — `calculateNextDateDaily`, `calculateNextDateYearly`
- `packages/client/src/utils/repeatRule.skip-logic.test.ts` — add daily skip tests, fix yearly boundary test
- `docs/adr/0002-recurring-tasks-skip-logic.md` — fix examples and algorithm description
- `.claude/rules/skip-logic.md` — update algorithm description

## Success Metrics

- M1: All existing tests pass after changes
- M2: Daily skip test covers interval=1, interval=3, and early completion scenarios
- M3: Yearly skip test covers "today == scheduled date" scenario (expects next year, not today)
- M4: Mutation score >= 95% on `repeatRule.ts`
- M5: ADR-0002 examples match actual code output

## Open Questions

(none — all resolved through user scenario analysis)
