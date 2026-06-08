# Tasks — repeating-task-rule-change

## 1. Unit tests: next_date recalculation on rule change (FR1, FR2, FR3, FR7)

- [x] 1.1 Test: daily→daily (interval change) — next_date recalculated from date of change
- [x] 1.2 Test: daily→weekly — next_date = nearest matching weekday from date of change
- [x] 1.3 Test: daily→monthly — next_date = nearest matching day_of_month from date of change
- [x] 1.4 Test: daily→yearly — next_date = nearest matching month_and_day from date of change
- [x] 1.5 Test: weekly→daily — next_date = date of change + interval
- [x] 1.6 Test: weekly→weekly (weekdays change) — next_date = nearest new weekday from date of change
- [x] 1.7 Test: monthly→daily — next_date = date of change + interval
- [x] 1.8 Test: fixed→after_completion — next_date = ""
- [x] 1.9 Test: after_completion→fixed daily — next_date = date of change + interval
- [x] 1.10 Test: after_completion→fixed weekly — next_date = nearest weekday from date of change
- [x] 1.11 Test: after_completion (delay_days change) — next_date stays ""

## 2. Unit tests: advance_days / target_box change (FR4, FR5)

- [x] 2.1 Test: advance_days change only — next_date unchanged, appear_date recalculated
- [x] 2.2 Test: target_box change only — next_date and appear_date unchanged

## 3. Integration tests: rule change + completion flow (FR1, G3)

- [x] 3.1 Test: change rule → complete → verify new copy has correct next_date
- [x] 3.2 Test: change rule (with time gap) → complete later → verify next_date based on rule change date
- [x] 3.3 Test: change to after_completion → complete → verify next_date from completedAt

## 4. Implementation: recalculate next_date on rule change

- [x] 4.1 Create helper `shouldRecalculateNextDate(oldRule, newRule): boolean`
- [x] 4.2 Create helper `calculateNextDateOnRuleChange(newRule, dateOfChange, clock): string`
- [x] 4.3 Update `handleRepeatChange` to compute and save next_date + appear_date together

## 5. Implementation: confirmation dialog (FR6, UX1, UX2)

- [x] 5.1 Create dialog component showing calculated next date
- [x] 5.2 Integrate dialog into TaskDetailsTab repeat rule change flow
- [x] 5.3 Allow cancel from dialog (revert to previous rule)

## 6. Mutation testing

- [x] 6.1 Run Stryker on new/changed files — 93.98% (8 equivalent mutants remain, all analyzed)

## 7. Bug fix: numeric inputs block clearing (FR8)

- [x] 7.1 Create `ClampedNumericInput` component with internal string state, onChange/onBlur clamping
- [x] 7.2 Replace all 5 `<input type="number">` in `RepeatRuleSelector` with `ClampedNumericInput`
- [x] 7.3 Simplify 5 change handlers (remove parseInt/clamp logic, now just setState)
- [x] 7.4 Verify all 51 existing tests pass
