## 1. ADR and Rules Update

- [ ] 1.1 Update ADR-0002 (`docs/adr/0002-recurring-tasks-skip-logic.md`): move daily from Model A to Model B, document all 11 scenarios from the state transition table, update examples and Change History (FR6)
- [ ] 1.2 Update `.claude/rules/skip-logic.md`: move daily from Model A to Model B, Model A retains only `after_completion` (FR6)

## 2. BDD Scenarios

- [ ] 2.1 Write BDD feature file with all 12 daily scenarios from spec: normal completion (interval=1, interval=3), early completion (interval=1, interval=3), late completion (interval=1, interval=3), long inactivity (interval=1, interval=3, candidate=today), nearest-match (create interval=1, create interval=3, rule change) — `@align-daily-to-calendar-rhythm @FR1 @FR2 @FR3 @FR4`
- [ ] 2.2 Write step definitions for the BDD feature (vitest-cucumber)

## 3. Core Implementation (TDD)

- [ ] 3.1 Rewrite `calculateNextDateDaily` to accept `previousNextDate` and `completedAtDate`, implement early-completion preservation and skip logic (FR1, FR2, FR3)
- [ ] 3.2 Update `resolveFromSchedule` daily branch to pass `completedAtDate` and `previousNextDate` to the new `calculateNextDateDaily` (FR5)
- [ ] 3.3 Update `resolveNearestMatch` daily branch to return `today + interval` instead of `today + 1` (FR4)
- [ ] 3.4 Update `calculateNextDate` dispatcher to pass `completedAtDate` and `previousNextDate` to `calculateNextDateDaily` (FR1)

## 4. Update Existing Tests

- [ ] 4.1 Update daily test expectations in `repeatRule.next-date.test.ts` to reflect calendar-aligned behavior
- [ ] 4.2 Update daily test expectations in `repeatRule.skip-logic.test.ts` to reflect early-completion preservation and skip-by-grid
- [ ] 4.3 Update daily test expectations in `repeatRule.resolve-next-fixed-date.test.ts` for nearest-match and from-schedule modes
- [ ] 4.4 Verify all weekly/monthly/yearly tests pass without changes (FR6 of unify-next-date-calculation)

## 5. Verification

- [ ] 5.1 Run `pnpm run build` to verify no type errors
- [ ] 5.2 Run Stryker on changed files (max 5) — target mutation score >= 95% (M3)
- [ ] 5.3 Add tests to kill any survived mutants
