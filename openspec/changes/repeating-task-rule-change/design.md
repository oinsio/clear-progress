# Design — repeating-task-rule-change

## Context

Driven by FR1-FR7 from proposal. The current code updates `repeat_rule` without recalculating `next_date`, causing incorrect dates on subsequent task completion.

## Decision 1: Recalculate next_date at the moment of rule change

When `repeat_rule` is saved via `handleRepeatChange` in `TaskDetailsTab`, the system must:

1. Detect whether the change affects `next_date` (frequency, interval, weekdays, day_of_month, month_and_day, type change)
2. If yes — calculate new `next_date` using current date as `previousNextDate`
3. Save both `repeat_rule` and `next_date` (and `appear_date`) in one update

### What counts as "affects next_date"

| Changed field | Recalculate? |
|---|---|
| type | Yes (or set "" for after_completion) |
| frequency | Yes |
| interval | Yes |
| weekdays | Yes |
| day_of_month | Yes |
| month_and_day | Yes |
| delay_days | No (stays "") |
| advance_days | No (only appear_date) |
| target_box | No |

## Decision 2: Use current date as base for recalculation

When recalculating `next_date` after a rule change, the base date is **today** (the date of the change), not the old `next_date`. This matches user expectation: "from now on, repeat by new rule."

For `calculateNextDate`, this means passing today's date as `previousNextDate`.

## Decision 3: Confirmation dialog

Before saving the new rule, show a dialog with the calculated `next_date` so the user understands the consequence. User can confirm or cancel.

## Alternatives Considered

1. **Recalculate at completion time** — rejected because the user expects the new rhythm to start from the moment of change, not from completion.
2. **Always use completedAt as base** — rejected because it would break the rhythm-preserving behavior for unchanged rules (Кейс 2 from exploration).
