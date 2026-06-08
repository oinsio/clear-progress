# Repeating Task Rule Change — Recalculate next_date

## Problem

When a user edits the repeat rule of a recurring task and then completes it, the new task copy gets an incorrect `next_date`. This happens because `next_date` is not recalculated when the rule changes — the old value (calculated for the previous rule) is used as the base for the new rule's calculation.

## Goals

- G1: When repeat rule changes, `next_date` is recalculated from the moment of change
- G2: User sees a confirmation dialog showing the calculated next date before saving
- G3: Completion logic continues to work correctly with the already-recalculated `next_date`

## Non-Goals

- NG1: Changing how completion itself calculates `next_date` (it already works correctly when `next_date` is valid)
- NG2: Changing `after_completion` logic (it doesn't use `next_date` for calculation)

## Functional Requirements

- FR1: When user changes frequency, interval, weekdays, day_of_month, or month_and_day — recalculate `next_date` from the date of change
- FR2: When user changes type from `fixed` to `after_completion` — set `next_date` to `""`
- FR3: When user changes type from `after_completion` to `fixed` — calculate `next_date` from the date of change
- FR4: When user changes only `advance_days` — do NOT recalculate `next_date`, only recalculate `appear_date`
- FR5: When user changes only `target_box` — do NOT recalculate `next_date`
- FR6: Show confirmation dialog with the calculated next date when rule changes affect `next_date`
- FR7: When `delay_days` changes within `after_completion` — `next_date` stays `""` (unknown until completion)

## UX Requirements

- UX1: Confirmation dialog shows the new calculated date in human-readable format
- UX2: User can cancel the rule change from the dialog

## Success Metrics

- M1: All repeat rule change + completion scenarios produce correct `next_date` (verified by unit tests)
- M2: Mutation testing score >= 95% on affected code
