# unify-next-date-calculation

## Why

The `next_date` calculation logic for recurring tasks is spread across two independent methods: `calculateNextDate` (on task completion) and `calculateNextDateOnRuleChange` (on repeat rule change). Both methods duplicate algorithms for weekly/monthly/yearly but implement them differently. This leads to a bug: when first creating a weekly task with `interval > 1`, the nearest matching day is skipped (e.g., "every 2 weeks on Mondays" created on Saturday sets the first trigger two weeks out instead of the nearest Monday). Unifying into a single method will eliminate the duplication, the bug, and the behavioral divergence.

## What Changes

- **MODIFIED**: Unified internal algorithm for `next_date` calculation across all fixed frequencies (daily, weekly, monthly, yearly), parameterized by mode: `nearest-match` (nearest future date without skip-logic) vs `from-schedule` (next date with interval and skip-logic from anchor)
- **REMOVED**: Duplicated weekly/monthly/yearly logic between `repeatRule.ts` and `repeatRuleChange.ts`
- **FIXED**: First creation of a weekly task with `interval > 1` now finds the nearest matching day instead of skipping `(interval - 1)` weeks
- **REMOVED**: Dead branch `!previousNextDate` in `calculateNextDateWeekly`

## Goals

- G1: Single point of `next_date` calculation for fixed frequencies — one algorithm, one file, no duplication
- G2: Consistent behavior between first creation and rule change — both paths produce the same result

## Non-Goals

- NG1: Changing `after_completion` logic — it is already centralized and not duplicated
- NG2: Changing `appear_date` logic — `calculateAppearDate` is already the single method
- NG3: Changing public skip-logic behavior for subsequent completions
- NG4: Changing the UI or adding new user scenarios

## Users & Scenarios

- U1: User creates a task "every 2 weeks on Mondays" on Saturday — the first trigger should be the nearest Monday, not two weeks out
- U2: User changes the repeat rule from daily to weekly — next_date is calculated by the same algorithm as on task completion

## Requirements

### Functional

- FR1: The internal `next_date` calculation method for fixed frequencies MUST accept a mode parameter: `nearest-match` (nearest future date, interval does not affect the first jump) and `from-schedule` (next date with interval and skip-logic from anchor date)
- FR2: `calculateNextDate` (task completion path) MUST use `nearest-match` mode on first creation (`!previousNextDate`) and `from-schedule` mode on subsequent completions
- FR3: `calculateNextDateOnRuleChange` MUST use `nearest-match` mode
- FR4: The dead branch `!previousNextDate` in `calculateNextDateWeekly` MUST be removed
- FR5: On first creation of a weekly task with `interval > 1`, the result MUST match the result of `calculateNextDateOnRuleChange` for the same parameters (nearest matching day)
- FR6: All existing tests for subsequent completions (from-schedule) MUST continue to pass without changing expectations

### Non-Functional

#### Performance
- NFR-P1: The refactoring MUST NOT affect date calculation performance

## UX Acceptance Criteria

- UX1: Behavior on subsequent task completions does not change
- UX2: On first creation and rule change — nearest matching date (no skipping due to interval)

## Behavior

Scenarios are covered in:
- `packages/client/src/test/features/repeating_tasks/next_date_weekly.feature`
- `packages/client/src/test/features/repeating_tasks/next_date_daily.feature`
- Existing unit tests: `repeatRule.next-date.test.ts`, `repeatRule.skip-logic.test.ts`, `repeatRule.rule-change-should-recalc.test.ts`

## Visual Reference

No UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: Number of `next_date` calculation points for fixed frequencies reduced from 2 to 1 (unified internal algorithm)
- M2: All existing tests pass without changing expectations (except the test for first creation of weekly with interval > 1)
- M3: Mutation score >= 95% on changed files

## Open Questions

None.

## Capabilities

### New Capabilities

No new capabilities.

### Modified Capabilities

- `repeating-tasks`: Unification of two next_date calculation points (calculateNextDate and calculateNextDateOnRuleChange) into a single internal algorithm with a mode parameter. Fix for the bug where the nearest day is skipped on first creation of weekly with interval > 1.

## Impact

- `packages/client/src/utils/repeatRule.ts` — refactoring of internal date calculation functions
- `packages/client/src/utils/repeatRuleChange.ts` — removal of duplicated logic, delegation to the unified algorithm
- `packages/client/src/services/TaskService.ts` — update of calculateNextDate call
- Tests: update/addition of tests for first creation with interval > 1
