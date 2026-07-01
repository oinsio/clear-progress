## 1. Update ADR-0002

- [x] 1.1 Add "User Rationale" section for Model A (daily, after_completion): examples "watering flowers", "workout", "haircut" — FR1
- [x] 1.2 Add rationale for Model B (weekly, monthly, yearly): examples "weekly report", "biweekly retrospective", "rent payment", "mom's birthday" — FR2
- [x] 1.3 Add early completion (advance_days) examples for each frequency — FR3
- [x] 1.4 Add clamping examples (day=31 in February, chain Feb→Mar) — FR3

## 2. BDD tests: daily early completion and exact alignment

- [x] 2.1 Add BDD scenario to next_date_daily.feature: daily/1, prev=Jul5, today=Jul3 → Jul4 (early completion) — FR7
- [x] 2.2 Add BDD scenario to next_date_daily.feature: daily/3, prev=Jan1, today=Jan7 → Jan10 (exact alignment) — FR8
- [x] 2.3 Add/update step definitions in next_date_daily.steps.ts for new scenarios
- [x] 2.4 Run BDD tests, verify they pass

## 3. BDD tests: weekly early completion

- [x] 3.1 Add BDD scenario to next_date_weekly.feature: weekly/1, Mon, prev=Jul6(Mon), today=Jul4(Sat) → Jul6 — FR4
- [x] 3.2 Add BDD scenario to next_date_weekly.feature: weekly/2, Mon, prev=Jul6(Mon), today=Jul4(Sat) → Jul6 — FR4
- [x] 3.3 Add/update step definitions in next_date_weekly.steps.ts for new scenarios
- [x] 3.4 Run BDD tests, verify they pass

## 4. BDD tests: monthly early completion

- [x] 4.1 Add BDD scenario to next_date_monthly.feature: monthly/1, day=15, prev=Jul15, today=Jul12 → Jul15 — FR5
- [x] 4.2 Add BDD scenario to next_date_monthly.feature: monthly/1, day=1, prev=Aug1, today=Jul28 → Aug1 — FR5
- [x] 4.3 Add/update step definitions in next_date_monthly.steps.ts for new scenarios
- [x] 4.4 Run BDD tests, verify they pass

## 5. BDD tests: yearly early completion

- [x] 5.1 Add BDD scenario to next_date_yearly.feature: yearly/1, Dec25, prev=Dec25, today=Dec20 → Dec25 — FR6
- [x] 5.2 Add/update step definitions in next_date_yearly.steps.ts for new scenario
- [x] 5.3 Run BDD tests, verify they pass

## 6. BDD tests: monthly clamping chains

- [x] 6.1 Add BDD scenario to next_date_monthly.feature: day=31, prev=Feb28(clamped), today=Feb28 → Mar31 — FR9
- [x] 6.2 Add BDD scenario to next_date_monthly.feature: day=30, prev=Jan30, today=Jan30 → Feb28 — FR10
- [x] 6.3 Add BDD scenario to next_date_monthly.feature: day=30, prev=Feb28(clamped), today=Feb28 → Mar30 — FR11
- [x] 6.4 Run BDD tests, verify they pass

## 7. Unit tests: early completion (skip-logic.test.ts)

- [x] 7.1 Add unit test: weekly early completion, prev=Jul6(Mon), today=Jul4(Sat) → Jul6 — FR12
- [x] 7.2 Add unit test: monthly early completion, prev=Jul15, today=Jul12 → Jul15 — FR13
- [x] 7.3 Add unit test: yearly early completion, prev=Dec25, today=Dec20 → Dec25 — FR14
- [x] 7.4 Run unit tests, verify they pass

## 8. Unit tests: monthly clamping chains

- [x] 8.1 Add unit test: day=31, prev=Feb28(clamped), today=Feb28 → Mar31 — FR15
- [x] 8.2 Add unit test: day=30, prev=Jan30, today=Jan30 → Feb28 — FR16
- [x] 8.3 Add unit test: day=30, prev=Feb28(clamped), today=Feb28 → Mar30 — FR16
- [x] 8.4 Run unit tests, verify they pass

## 9. Fix code if tests reveal discrepancies

- [x] 9.1 If any new test fails because the code contradicts the expected behavior from the discussed scenarios, fix the code to match the spec — not the other way around
- [x] 9.2 Re-run failing tests after each fix to confirm green

## 10. Verification

- [x] 10.1 Check skip-logic.test.ts line count; if >300 lines, extract into separate file (D3 from design.md)
- [x] 10.2 Run full repeating_tasks BDD + unit test suite
- [x] 10.3 Run pnpm run build — verify project builds
