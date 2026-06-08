# Tasks — repeating-task-rule-change

## 1. Unit tests: next_date recalculation on rule change (FR1, FR2, FR3, FR7)

- [ ] 1.1 Test: daily→daily (interval change) — next_date recalculated from date of change
- [ ] 1.2 Test: daily→weekly — next_date = nearest matching weekday from date of change
- [ ] 1.3 Test: daily→monthly — next_date = nearest matching day_of_month from date of change
- [ ] 1.4 Test: daily→yearly — next_date = nearest matching month_and_day from date of change
- [ ] 1.5 Test: weekly→daily — next_date = date of change + interval
- [ ] 1.6 Test: weekly→weekly (weekdays change) — next_date = nearest new weekday from date of change
- [ ] 1.7 Test: monthly→daily — next_date = date of change + interval
- [ ] 1.8 Test: fixed→after_completion — next_date = ""
- [ ] 1.9 Test: after_completion→fixed daily — next_date = date of change + interval
- [ ] 1.10 Test: after_completion→fixed weekly — next_date = nearest weekday from date of change
- [ ] 1.11 Test: after_completion (delay_days change) — next_date stays ""

## 2. Unit tests: advance_days / target_box change (FR4, FR5)

- [ ] 2.1 Test: advance_days change only — next_date unchanged, appear_date recalculated
- [ ] 2.2 Test: target_box change only — next_date and appear_date unchanged

## 3. Integration tests: rule change + completion flow (FR1, G3)

- [ ] 3.1 Test: change rule → complete → verify new copy has correct next_date
- [ ] 3.2 Test: change rule (with time gap) → complete later → verify next_date based on rule change date
- [ ] 3.3 Test: change to after_completion → complete → verify next_date from completedAt

## 4. Implementation: recalculate next_date on rule change

- [ ] 4.1 Create helper `shouldRecalculateNextDate(oldRule, newRule): boolean`
- [ ] 4.2 Create helper `calculateNextDateOnRuleChange(newRule, dateOfChange, clock): string`
- [ ] 4.3 Update `handleRepeatChange` to compute and save next_date + appear_date together

## 5. Implementation: confirmation dialog (FR6, UX1, UX2)

- [ ] 5.1 Create dialog component showing calculated next date
- [ ] 5.2 Integrate dialog into TaskDetailsTab repeat rule change flow
- [ ] 5.3 Allow cancel from dialog (revert to previous rule)

## 6. Mutation testing

- [ ] 6.1 Run Stryker on new/changed files, target >= 95%
