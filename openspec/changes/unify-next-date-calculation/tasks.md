## 1. Create the unified internal algorithm resolveNextFixedDate

- [ ] 1.1 TDD RED: write tests for `resolveNextFixedDate` in `nearest-match` mode for weekly with interval > 1 (FR1, FR5 — bug fix), monthly, yearly. Ensure tests fail
- [ ] 1.2 TDD GREEN: implement `resolveNextFixedDate(rule, anchor, mode, clock)` in `repeatRule.ts` — dispatcher calling frequency calculators with mode (FR1). For `nearest-match` weekly, use `findNextWeekday(tomorrow, weekdays, 1)` — interval=1 for the first jump (D2 from design.md)
- [ ] 1.3 TDD REFACTOR: remove the dead branch `!previousNextDate` from `calculateNextDateWeekly` (FR4). Ensure all existing tests pass (FR6)

## 2. Remove duplicated logic from repeatRuleChange.ts

- [ ] 2.1 Replace the body of `calculateNextDateOnRuleChange` with delegation to `resolveNextFixedDate` with mode=`nearest-match` (FR3, D3). Remove duplicated weekly/monthly/yearly implementations from `repeatRuleChange.ts`
- [ ] 2.2 Run existing `repeatRule.rule-change-*.test.ts` tests — all must pass without changing expectations

## 3. Update calculateNextDate (completion path)

- [ ] 3.1 Update `calculateNextDate` — when `!previousNextDate` (first creation) use mode `nearest-match`, when previousNextDate exists — use mode `from-schedule` (FR2, D3)
- [ ] 3.2 Run existing `repeatRule.next-date.test.ts`, `repeatRule.skip-logic.test.ts`, `repeatRule.timezone.test.ts` tests — all must pass (FR6)

## 4. BDD tests for the bug fix

- [ ] 4.1 Add BDD scenarios to `next_date_weekly.feature` for first creation of weekly with interval > 1: nearest matching day, not skipped (FR5)
- [ ] 4.2 Implement step definitions for new scenarios

## 5. Verification

- [ ] 5.1 Run `pnpm run build` — successful build
- [ ] 5.2 Run mutation testing on changed files (`repeatRule.ts`, `repeatRuleChange.ts`) — mutation score >= 95% (M3)
