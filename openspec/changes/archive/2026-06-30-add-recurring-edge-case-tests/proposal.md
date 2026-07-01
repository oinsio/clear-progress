# Add Recurring Edge Case Tests

## Why

ADR-0002 documents two next_date computation models (Model A: "from today", Model B: "by schedule") but lacks user rationale and examples for all discussed scenarios — especially early completion (advance_days) for all frequencies, clamping chains for monthly, and the reasoning behind why daily/after_completion use Model A while weekly/monthly/yearly use Model B. Tests cover only basic cases: no BDD tests for early completion of any frequency, no tests for clamping chains (day=31: Feb→Mar), and missing BDD coverage for daily skip exact alignment.

## What Changes

- **MODIFIED**: ADR-0002 — add user rationale and examples for all discussed scenarios across all frequencies (daily, weekly, monthly, yearly, after_completion)
- **ADDED**: BDD tests for uncovered scenarios (early completion for daily/weekly/monthly/yearly, clamping chains for monthly, daily skip exact alignment)
- **ADDED**: Unit tests (TDD) for uncovered edge cases

## Goals

- G1: Every discussed scenario (1-16) has a test confirming expected behavior
- G2: ADR-0002 contains user rationale for each model with concrete real-world examples

## Non-Goals

- NG1: Changing next_date computation logic — tests and documentation only
- NG2: UI changes or new features

## Users & Scenarios

- U1: Developer reads ADR and understands **why** daily counts from today while weekly/monthly/yearly follow a schedule
- U2: Developer adds advance_days to a weekly task — test confirms schedule rhythm is preserved
- U3: Developer modifies monthly clamping — test confirms day=31 returns to 31 after February
- U4: Developer sees daily early completion test — understands that daily always uses today + interval regardless of scheduled date

## Requirements

### Functional

- FR1: ADR-0002 contains user rationale for Model A (daily, after_completion) with real-world examples ("watering flowers", "workout", "haircut")
- FR2: ADR-0002 contains user rationale for Model B (weekly, monthly, yearly) with real-world examples ("weekly report", "biweekly retrospective", "rent payment", "mom's birthday")
- FR3: ADR-0002 contains examples for early completion (advance_days) for each frequency and clamping
- FR4: BDD tests cover early completion (advance_days) for weekly — schedule rhythm preserved
- FR5: BDD tests cover early completion (advance_days) for monthly — schedule rhythm preserved
- FR6: BDD tests cover early completion (advance_days) for yearly — schedule rhythm preserved
- FR7: BDD tests cover early completion (advance_days) for daily — today + interval
- FR8: BDD tests cover daily skip logic exact alignment — today + interval, not schedule-aligned
- FR9: BDD tests cover monthly clamping chain (day=31: Feb28 → Mar31)
- FR10: BDD tests cover monthly clamping for day=30 in February
- FR11: BDD tests cover monthly clamping recovery (day=30: Feb28 → Mar30)
- FR12: Unit tests cover weekly early completion (prev > today)
- FR13: Unit tests cover monthly early completion (prev > today)
- FR14: Unit tests cover yearly early completion (prev > today)
- FR15: Unit tests cover monthly clamping chain (day=31: Jan→Feb28→Mar31)
- FR16: Unit tests cover monthly clamping for day=30 in February

### Non-Functional

None — changes are limited to tests and documentation.

## UX Acceptance Criteria

None — no UI changes.

## Behavior

New BDD scenarios in:
- `features/repeating_tasks/next_date_daily.feature` (@add-recurring-edge-case-tests @FR7, @FR8)
- `features/repeating_tasks/next_date_weekly.feature` (@add-recurring-edge-case-tests @FR4)
- `features/repeating_tasks/next_date_monthly.feature` (@add-recurring-edge-case-tests @FR5, @FR9, @FR10, @FR11)
- `features/repeating_tasks/next_date_yearly.feature` (@add-recurring-edge-case-tests @FR6)

## Affected IA

No changes.

## Success Metrics

- M1: All 16 discussed scenarios have tests (BDD + unit)
- M2: Mutation score on repeatRule.ts >=95% (current level maintained)
- M3: ADR-0002 contains at least 12 examples with user rationale

## Open Questions

None — all questions resolved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `repeating-tasks`: adding BDD scenarios for early completion across all frequencies and monthly clamping chains

## Impact

- `docs/adr/0002-recurring-tasks-skip-logic.md` — documentation update
- `packages/client/src/test/features/repeating_tasks/` — new BDD scenarios and step definitions
- `packages/client/src/utils/repeatRule.skip-logic.test.ts` — new unit tests
