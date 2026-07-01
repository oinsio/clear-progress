## 1. ADR and Rules Update

- [x] 1.1 Update ADR-0002 (`docs/adr/0002-recurring-tasks-skip-logic.md`): move daily from Model A to Model B, document all 11 scenarios from the state transition table, update examples and Change History (FR6)
- [x] 1.2 Update `.claude/rules/skip-logic.md`: move daily from Model A to Model B, Model A retains only `after_completion` (FR6)

## 2. BDD Scenarios

- [x] 2.1 Write BDD feature file with all 12 daily scenarios from spec: normal completion (interval=1, interval=3), early completion (interval=1, interval=3), late completion (interval=1, interval=3), long inactivity (interval=1, interval=3, candidate=today), nearest-match (create interval=1, create interval=3, rule change) — `@align-daily-to-calendar-rhythm @FR1 @FR2 @FR3 @FR4`
- [x] 2.2 Write step definitions for the BDD feature (vitest-cucumber)

## 3. Core Implementation (TDD)

- [x] 3.1 Rewrite `calculateNextDateDaily` to accept `previousNextDate` and `completedAtDate`, implement early-completion preservation and skip logic (FR1, FR2, FR3)
- [x] 3.2 Update `resolveFromSchedule` daily branch to pass `completedAtDate` and `previousNextDate` to the new `calculateNextDateDaily` (FR5)
- [x] 3.3 Update `resolveNearestMatch` daily branch to return `today + interval` instead of `today + 1` (FR4)
- [x] 3.4 Update `calculateNextDate` dispatcher to pass `completedAtDate` and `previousNextDate` to `calculateNextDateDaily` (FR1)

## 4. Update Existing Tests

- [x] 4.1 Update daily test expectations in `repeatRule.next-date.test.ts` to reflect calendar-aligned behavior
- [x] 4.2 Update daily test expectations in `repeatRule.skip-logic.test.ts` to reflect early-completion preservation and skip-by-grid
- [x] 4.3 Update daily test expectations in `repeatRule.resolve-next-fixed-date.test.ts` for nearest-match and from-schedule modes
- [x] 4.4 Verify all weekly/monthly/yearly tests pass without changes (FR6 of unify-next-date-calculation)

## 5. Verification

- [x] 5.1 Run `pnpm run build` to verify no type errors
- [x] 5.2 Run Stryker on changed files (max 5) — mutation score 98.63% covered (91.99% total including 21 no-coverage mutants from unrelated formatting code) (M3)
- [x] 5.3 4 survived mutants are in pre-existing weekly/formatting code, not in daily changes — no additional tests needed
