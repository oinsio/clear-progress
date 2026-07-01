## Context

Driven by FR1-FR6 from proposal.

The `next_date` calculation for fixed frequencies is implemented in two places:

1. **`repeatRule.ts`** — `calculateNextDate()` -> calls `calculateNextDateDaily/Weekly/Monthly/Yearly`. Used on task completion (`TaskService.complete()`). Contains skip-logic for skipping past dates.

2. **`repeatRuleChange.ts`** — `calculateNextDateOnRuleChange()` with its own implementation of weekly/monthly/yearly. Used on repeat rule change (`computeRuleChangeUpdates()`). Does not contain skip-logic, finds the nearest future date.

Both methods solve the same problem but diverge in details: with `interval > 1` for weekly, the first path skips the nearest day, while the second does not.

## Goals / Non-Goals

**Goals:**
- Unified internal algorithm for `next_date` calculation across all fixed frequencies
- Two modes: `nearest-match` and `from-schedule`
- Fix for the bug with first creation of weekly + interval > 1

**Non-Goals:**
- Changing public signatures of `calculateNextDate` and `calculateNextDateOnRuleChange` (wrappers are preserved)
- Changing `after_completion` logic and `calculateAppearDate`

## Decisions

### D1: Unified dispatcher `resolveNextFixedDate`

Create an internal function `resolveNextFixedDate(rule, anchor, mode, clock)`:

- `anchor` — the date to calculate from (today for nearest-match, previousNextDate for from-schedule)
- `mode: "nearest-match" | "from-schedule"`
- The function calls frequency-specific calculators, passing them the mode

**Alternative**: pass `interval=1` for nearest-match instead of mode. Rejected because for monthly/yearly, nearest-match also differs from from-schedule (nearest-match finds the nearest date >= tomorrow, from-schedule calculates anchor + interval with skip-logic).

### D2: Frequency calculators accept mode

Each calculator (`calculateNextDateDaily`, `calculateNextDateWeekly`, etc.) receives a `mode` parameter:

- **daily**: no changes — both modes yield `today + interval` (daily is always "from today")
- **weekly nearest-match**: `findNextWeekday(tomorrow, weekdays, 1)` — interval=1 for the first jump, nearest matching day
- **weekly from-schedule**: current logic without the dead branch — from previousNextDate + 1 with interval and skip-logic
- **monthly nearest-match**: nearest future day_of_month > today (current `calculateNextDateOnRuleChange` logic)
- **monthly from-schedule**: anchor + interval months with skip-logic (current `calculateNextDateMonthly` logic)
- **yearly nearest-match**: nearest future month_and_day > today (current `calculateNextDateOnRuleChange` logic)
- **yearly from-schedule**: anchor + interval years with skip-logic (current `calculateNextDateYearly` logic)

### D3: Public wrappers are preserved

`calculateNextDate` and `calculateNextDateOnRuleChange` remain as the public API but delegate to `resolveNextFixedDate`:

- `calculateNextDate`: when `!previousNextDate` -> mode `nearest-match`, otherwise -> mode `from-schedule`
- `calculateNextDateOnRuleChange`: always mode `nearest-match`

This minimizes changes in calling code (`TaskService`, `computeRuleChangeUpdates`).

### D4: File structure

All date calculation logic stays in `repeatRule.ts`. Duplicated logic is removed from `repeatRuleChange.ts` — `calculateNextDateOnRuleChange` delegates to `resolveNextFixedDate` from `repeatRule.ts`. `shouldRecalculateNextDate` and `computeRuleChangeUpdates` remain in `repeatRuleChange.ts` — they are orchestration logic, not date calculation.

## Risks / Trade-offs

- [Risk] Refactoring may break skip-logic edge-case behavior -> Mitigation: existing tests cover all edge cases, mutation testing >= 95%
- [Trade-off] Mode parameter adds branching inside calculators -> Acceptable since it replaces a fully duplicated implementation
