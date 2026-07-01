## 1. calculateUpcomingDates utility

- [ ] 1.1 TDD RED: write tests for `calculateUpcomingDates` — weekly with interval > 1 and multiple weekdays, daily, monthly with clamping, after_completion returns empty array (FR8, FR9)
- [ ] 1.2 TDD GREEN: implement `calculateUpcomingDates(rule, startDate, count, clock)` in `packages/client/src/utils/upcomingDates.ts` — sequential computation of N dates via the unified algorithm (FR8)
- [ ] 1.3 TDD REFACTOR: ensure all tests pass, extract constant `UPCOMING_DATES_COUNT = 5`

## 2. Date formatting utility

- [ ] 2.1 TDD RED: write tests for `formatNextDate` — today, tomorrow, current year with weekday, different year, daily without weekday (FR3, FR4)
- [ ] 2.2 TDD GREEN: implement `formatNextDate(isoDate, frequency, clock)` in `packages/client/src/utils/formatRecurrenceDate.ts` — relative + Intl.DateTimeFormat (FR3, FR4)
- [ ] 2.3 TDD RED: write tests for `formatUpcomingDate` — absolute format, daily without weekday, different year (FR7)
- [ ] 2.4 TDD GREEN: implement `formatUpcomingDate(isoDate, frequency, clock)` — no relative, always absolute (FR7)
- [ ] 2.5 Add i18n keys to `ru.json` and `en.json`: `repeat.nextDateLabel`, `repeat.nextDateAfterCompletion`, `repeat.upcomingDatesLabel`, `repeat.today`, `repeat.tomorrow` (FR1, FR2)

## 3. UI: TaskDetailsTab — next_date line

- [ ] 3.1 Add a line with the formatted `next_date` below the repeat rule DrillDownRow in TaskDetailsTab (FR1, FR2, UX1)
- [ ] 3.2 Show "after completion" when `next_date` is empty and type is `after_completion` (FR2)
- [ ] 3.3 Do not show the line if the task has no `repeat_rule` (FR1)
- [ ] 3.4 Verify a11y: text is readable by screen readers (NFR-A1)

## 4. UI: RepeatRuleSelector — date preview

- [ ] 4.1 Add a preview section with 5 dates at the bottom of Step 2 in RepeatRuleSelector (FR5, UX2)
- [ ] 4.2 Update the preview on every rule parameter change (FR6)
- [ ] 4.3 Hide the preview for `after_completion` and when required fields are not filled (FR9)
- [ ] 4.4 Semantic markup `<ul>` for the date list (NFR-A2)
- [ ] 4.5 Verify rendering on 320px (NFR-R1)

## 5. Verification

- [ ] 5.1 Run `pnpm run build` — successful build
- [ ] 5.2 Mutation testing on `upcomingDates.ts` and `formatRecurrenceDate.ts` — score >= 95% (M3)
