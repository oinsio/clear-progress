# Tasks: repeating-tasks-specs

## 1. Create stable spec in openspec/specs/repeating-tasks/

- [ ] 1.1 Verify spec content covers all FR1-FR13 requirements from proposal.md

## 2. BDD: Repeat Rule Parsing & Serialization (FR1, FR2)

- [ ] 2.1 Create `features/repeating_tasks/repeat_rule_parsing.feature` — scenarios: parse valid fixed rule, parse valid after_completion rule, parse empty string, parse invalid JSON, parse failing Zod validation, serialize rule, format labels. Tag `@repeating-tasks-specs @FR1 @FR2`
- [ ] 2.2 Create `features/repeating_tasks/steps/repeat_rule_parsing.steps.ts` — step definitions using parseRepeatRule, serializeRepeatRule, formatRepeatRuleLabel
- [ ] 2.3 Verify all scenarios pass: `npx vitest run --reporter=verbose` filtering repeat_rule_parsing

## 3. BDD: Next Date Daily (FR3)

- [ ] 3.1 Create `features/repeating_tasks/next_date_daily.feature` — scenarios: interval 1 next day, interval 3, skip logic skips missed days, skip logic exact alignment. Tag `@repeating-tasks-specs @FR3`
- [ ] 3.2 Create `features/repeating_tasks/steps/next_date_daily.steps.ts` — step definitions using calculateNextDate with fakeClock
- [ ] 3.3 Verify all scenarios pass

## 4. BDD: Next Date Weekly (FR4)

- [ ] 4.1 Create `features/repeating_tasks/next_date_weekly.feature` — scenarios: single weekday, multiple weekdays, interval 2, skip logic. Tag `@repeating-tasks-specs @FR4`
- [ ] 4.2 Create `features/repeating_tasks/steps/next_date_weekly.steps.ts`
- [ ] 4.3 Verify all scenarios pass

## 5. BDD: Next Date Monthly (FR5)

- [ ] 5.1 Create `features/repeating_tasks/next_date_monthly.feature` — scenarios: interval 1, end-of-month clamping, skip logic skips past months, interval 3 skip. Tag `@repeating-tasks-specs @FR5`
- [ ] 5.2 Create `features/repeating_tasks/steps/next_date_monthly.steps.ts`
- [ ] 5.3 Verify all scenarios pass

## 6. BDD: Next Date Yearly (FR6)

- [ ] 6.1 Create `features/repeating_tasks/next_date_yearly.feature` — scenarios: interval 1, Feb 29 non-leap year, skip logic. Tag `@repeating-tasks-specs @FR6`
- [ ] 6.2 Create `features/repeating_tasks/steps/next_date_yearly.steps.ts`
- [ ] 6.3 Verify all scenarios pass

## 7. BDD: Next Date After Completion (FR7)

- [ ] 7.1 Create `features/repeating_tasks/next_date_after_completion.feature` — scenarios: delay 3 days, uses current timezone, no skip logic. Tag `@repeating-tasks-specs @FR7`
- [ ] 7.2 Create `features/repeating_tasks/steps/next_date_after_completion.steps.ts`
- [ ] 7.3 Verify all scenarios pass

## 8. BDD: Appear Date (FR8)

- [ ] 8.1 Create `features/repeating_tasks/appear_date.feature` — scenarios: 0 advance days, 7 advance days, 30 advance days. Tag `@repeating-tasks-specs @FR8`
- [ ] 8.2 Create `features/repeating_tasks/steps/appear_date.steps.ts`
- [ ] 8.3 Verify all scenarios pass

## 9. BDD: Recurring Copy Creation (FR9, FR13)

- [ ] 9.1 Create `features/repeating_tasks/recurring_copy.feature` — scenarios: creates copy on completion, preserves original_task_id chain, copies checklist items, updates existing hidden copy. Tag `@repeating-tasks-specs @FR9 @FR13`
- [ ] 9.2 Create `features/repeating_tasks/steps/recurring_copy.steps.ts` — step definitions using TaskService.complete with fake-indexeddb
- [ ] 9.3 Verify all scenarios pass

## 10. BDD: Hidden Task Reveal (FR10, FR11)

- [ ] 10.1 Create `features/repeating_tasks/hidden_task_reveal.feature` — scenarios: hidden when appear_date future, visible when today/past, reveal on arrive, do not reveal future, trigger on mount/midnight. Tag `@repeating-tasks-specs @FR10 @FR11`
- [ ] 10.2 Create `features/repeating_tasks/steps/hidden_task_reveal.steps.ts` — step definitions using HiddenTaskService
- [ ] 10.3 Verify all scenarios pass

## 11. BDD: Timezone Adaptation (FR12)

- [ ] 11.1 Create `features/repeating_tasks/timezone_adaptation.feature` — scenarios: timezone affects date interpretation, same instant different timezone different date. Tag `@repeating-tasks-specs @FR12`
- [ ] 11.2 Create `features/repeating_tasks/steps/timezone_adaptation.steps.ts` — step definitions using fakeClock with different timeZoneId
- [ ] 11.3 Verify all scenarios pass

## 12. Verification

- [ ] 12.1 Run full BDD test suite: `npx vitest run` — all new and existing tests pass
- [ ] 12.2 Run build: `pnpm run build` — no compilation errors
- [ ] 12.3 Verify traceability: every FR from proposal has at least one @FR-X tag in .feature files
