# Capability: Repeating Tasks

## Purpose

Recurring task lifecycle: parsing repeat rules, calculating next occurrence dates with skip logic, creating recurring copies on completion, managing hidden tasks with advance days, and adapting to timezone changes. Ensures only one future occurrence exists at a time (no backlog flood).

## ADDED Requirements

### Requirement: System can parse a repeat rule from JSON
# implements FR1 of repeating-tasks-specs

System MUST parse a JSON string into a RepeatRule object using Zod validation. Empty string or invalid JSON MUST return null.

#### Scenario: Parse valid fixed daily rule
- **GIVEN** JSON string `{"type":"fixed","frequency":"daily","interval":1,"target_box":"today","advance_days":0}`
- **WHEN** system parses the repeat rule
- **THEN** result is a RepeatRule with type "fixed", frequency "daily", interval 1

#### Scenario: Parse valid after_completion rule
- **GIVEN** JSON string `{"type":"after_completion","delay_days":3,"target_box":"inbox","advance_days":0}`
- **WHEN** system parses the repeat rule
- **THEN** result is a RepeatRule with type "after_completion", delay_days 3

#### Scenario: Parse empty string returns null
- **GIVEN** an empty string ""
- **WHEN** system parses the repeat rule
- **THEN** result is null

#### Scenario: Parse invalid JSON returns null
- **GIVEN** JSON string `{not valid}`
- **WHEN** system parses the repeat rule
- **THEN** result is null

#### Scenario: Parse JSON failing Zod validation returns null
- **GIVEN** JSON string `{"type":"unknown_type"}`
- **WHEN** system parses the repeat rule
- **THEN** result is null

### Requirement: System can serialize a repeat rule and format a label
# implements FR2 of repeating-tasks-specs

System MUST serialize a RepeatRule to JSON string. System MUST format a human-readable label using i18n translations for all frequency types.

#### Scenario: Serialize a fixed daily rule
- **GIVEN** a RepeatRule with type "fixed", frequency "daily", interval 2
- **WHEN** system serializes the rule
- **THEN** result is a valid JSON string containing the rule fields

#### Scenario: Format label for daily with interval 1
- **GIVEN** a RepeatRule with type "fixed", frequency "daily", interval 1
- **WHEN** system formats the label
- **THEN** result uses i18n key "repeat.everyNDays" with count 1

#### Scenario: Format label for weekly with weekdays
- **GIVEN** a RepeatRule with type "fixed", frequency "weekly", interval 1, weekdays [1, 3, 5]
- **WHEN** system formats the label
- **THEN** result includes translated weekday names

#### Scenario: Format label for after_completion
- **GIVEN** a RepeatRule with type "after_completion", delay_days 5
- **WHEN** system formats the label
- **THEN** result uses i18n key "repeat.afterCompletion" with count 5

### Requirement: System calculates next date for fixed daily frequency
# implements FR3 of repeating-tasks-specs, FR1, FR2 of fix-recurring-skip-logic

System MUST calculate `next_date` as `today + interval` for daily frequency, regardless of the previous next_date. This applies to all daily scenarios: normal completion, skip (user was inactive), and early completion (via advance_days). The previous next_date is not used in the calculation.

This differs from weekly/monthly/yearly which use schedule-based computation. Daily tasks represent habits where the interval counts from the last execution date, not from an abstract schedule.

#### Scenario: Daily interval 1 normal completion
- **WHEN** previous next_date is "2026-01-15" and today is "2026-01-15"
- **THEN** system calculates next date with daily interval 1 as "2026-01-16"

#### Scenario: Daily interval 3 normal completion
- **WHEN** previous next_date is "2026-01-15" and today is "2026-01-15"
- **THEN** system calculates next date with daily interval 3 as "2026-01-18"

#### Scenario: Daily skip logic — interval 1, inactive 6 days
- **WHEN** previous next_date is "2026-04-10" and today is "2026-04-16"
- **THEN** system calculates next date with daily interval 1 as "2026-04-17" (today + 1, not schedule-aligned 2026-04-16)

#### Scenario: Daily skip logic — interval 3, inactive 10 days
- **WHEN** previous next_date is "2026-04-10" and today is "2026-04-20"
- **THEN** system calculates next date with daily interval 3 as "2026-04-23" (today + 3, not schedule-aligned 2026-04-22)

#### Scenario: Daily early completion via advance_days
- **WHEN** previous next_date is "2026-07-05" and today is "2026-07-03" (task visible early due to advance_days)
- **THEN** system calculates next date with daily interval 1 as "2026-07-04" (today + 1, ignores original schedule)

#### Scenario: Daily skip logic exact alignment — result still uses today
- **WHEN** previous next_date is "2026-01-01" and today is "2026-01-07"
- **THEN** system calculates next date with daily interval 3 as "2026-01-10" (today + 3, not schedule-aligned 2026-01-07)

### Requirement: System calculates next date for fixed weekly frequency
# implements FR4 of repeating-tasks-specs

System MUST find the next matching weekday from the weekdays list, respecting the interval (every N weeks). Skip logic MUST align to the nearest future week period if the candidate is in the past. Weekdays use ISO 8601 (1=Monday, 7=Sunday).

#### Scenario: Weekly single weekday
- **GIVEN** previous next_date is Monday "2026-01-05" and weekdays [1] (Monday) and today is "2026-01-05"
- **WHEN** system calculates next date with weekly interval 1
- **THEN** result is "2026-01-12" (next Monday)

#### Scenario: Weekly multiple weekdays
- **GIVEN** previous next_date is Monday "2026-01-05" and weekdays [1, 3, 5] (Mon, Wed, Fri) and today is "2026-01-05"
- **WHEN** system calculates next date with weekly interval 1
- **THEN** result is "2026-01-07" (next Wednesday)

#### Scenario: Weekly interval 2
- **GIVEN** previous next_date is Monday "2026-01-05" and weekdays [1] (Monday) and today is "2026-01-05"
- **WHEN** system calculates next date with weekly interval 2
- **THEN** result is "2026-01-19" (Monday two weeks later)

#### Scenario: Weekly skip logic skips missed weeks
- **GIVEN** previous next_date is "2026-01-06" and weekdays [1] (Monday) and today is "2026-02-01"
- **WHEN** system calculates next date with weekly interval 1
- **THEN** result is the nearest Monday on or after "2026-02-01"

### Requirement: Weekly recurrence with multiple weekdays respects interval as week-level skip
# implements FR5 of repeating-tasks-specs

System MUST treat `interval` in weekly recurrence as the number of weeks between active periods, not as a gap between individual weekday occurrences. When `weekdays` contains multiple days, all matching days within the same ISO week SHALL fire before advancing to the next active week.

The algorithm for `calculateNextDateWeekly` SHALL be:
1. Compute `nextDay = previousNextDate + 1 day`
2. Find all weekdays in the same ISO week as `nextDay` that are >= `nextDay`
3. If any matching weekday exists in the current week, return the earliest one (no interval skip)
4. If no matching weekday remains in the current week, advance to Monday of the next week, then skip `(interval - 1) * 7` days, and return the first matching weekday

#### Scenario: Biweekly Mon+Wed fires both days in active week
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], previousNextDate="2026-06-01" (Monday)
- **THEN** next date is "2026-06-03" (Wednesday of the same week)

#### Scenario: Biweekly Mon+Wed skips to next active week after Wednesday
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], previousNextDate="2026-06-03" (Wednesday)
- **THEN** next date is "2026-06-15" (Monday, two weeks later)

#### Scenario: Chain of 6 completions for biweekly Mon+Wed
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], starting from previousNextDate="2026-06-01"
- **THEN** the chain of next dates is: "2026-06-03", "2026-06-15", "2026-06-17", "2026-06-29", "2026-07-01", "2026-07-13"

#### Scenario: Single weekday with interval > 1 unchanged
- **WHEN** rule is weekly, interval=2, weekdays=[1], previousNextDate="2026-06-01" (Monday)
- **THEN** next date is "2026-06-15" (Monday, two weeks later)

### Requirement: Skip logic for weekly recurrence with multiple weekdays
# implements FR6 of repeating-tasks-specs

When skip logic is applied (previousNextDate is far in the past), the system MUST align to the correct active week and then apply the same two-step weekday selection (current week first, then advance). The period for skip calculation remains `7 * interval` days.

#### Scenario: Skip aligns to active week for multi-weekday
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], previousNextDate="2026-04-06" (Monday), today is "2026-06-10" (Wednesday)
- **THEN** next date is a Monday or Wednesday >= today, aligned to the correct biweekly cadence

### Requirement: System calculates next date for fixed monthly frequency
# implements FR5 of repeating-tasks-specs

System MUST advance by interval months to the specified day_of_month. If day_of_month exceeds days in target month, system MUST clamp to last day (e.g., 31 in February becomes 28). Skip logic MUST skip past months if target month is in the past.

#### Scenario: Monthly interval 1
- **GIVEN** previous next_date is "2026-01-15" and day_of_month 15 and today is "2026-01-15"
- **WHEN** system calculates next date with monthly interval 1
- **THEN** result is "2026-02-15"

#### Scenario: Monthly end-of-month clamping
- **GIVEN** previous next_date is "2026-01-31" and day_of_month 31 and today is "2026-01-31"
- **WHEN** system calculates next date with monthly interval 1
- **THEN** result is "2026-02-28" (February has 28 days in 2026)

#### Scenario: Monthly skip logic skips past months
- **GIVEN** previous next_date is "2026-01-15" and day_of_month 15 and today is "2026-04-20"
- **WHEN** system calculates next date with monthly interval 1
- **THEN** result is "2026-05-15" (next month where 15th is in the future)

#### Scenario: Monthly interval 3 skip logic
- **GIVEN** previous next_date is "2026-01-15" and day_of_month 15 and today is "2026-06-01"
- **WHEN** system calculates next date with monthly interval 3
- **THEN** result is "2026-07-15" (aligned to every-3-month period)

### Requirement: System calculates next date for fixed yearly frequency
# implements FR6 of repeating-tasks-specs, FR3 of fix-recurring-skip-logic

System MUST advance by interval years to the specified month_and_day. If day_of_month exceeds days in target month, system MUST clamp to last day (e.g., Feb 29 in non-leap year becomes Feb 28). Skip logic MUST skip past years if target year is in the past. If the calculated date equals today, system MUST advance by one more interval (strictly after today).

#### Scenario: Yearly interval 1 normal completion
- **WHEN** previous next_date is "2026-03-20" and month_and_day {month: 3, day: 20} and today is "2026-03-20"
- **THEN** result is "2027-03-20" (today is the scheduled date, advance to next year)

#### Scenario: Yearly Feb 29 in non-leap year
- **WHEN** previous next_date is "2024-02-29" and month_and_day {month: 2, day: 29} and today is "2024-02-29"
- **THEN** result is "2025-02-28" (2025 is not a leap year, clamp to 28)

#### Scenario: Yearly skip logic skips past years
- **WHEN** previous next_date is "2024-06-15" and month_and_day {month: 6, day: 15} and today is "2027-01-01"
- **THEN** result is "2027-06-15"

#### Scenario: Yearly skip logic — today equals scheduled date
- **WHEN** previous next_date is "2024-03-15" and month_and_day {month: 3, day: 15} and today is "2026-03-15"
- **THEN** result is "2027-03-15" (today is the date, strictly after today means next year)

#### Scenario: Yearly Feb 29 skip — non-leap year clamps and still strictly after today
- **WHEN** previous next_date is "2024-02-29" and month_and_day {month: 2, day: 29} and today is "2026-04-16"
- **THEN** result is "2027-02-28" (nearest future year, clamped)

### Requirement: System calculates next date for after_completion type
# implements FR7 of repeating-tasks-specs

System MUST add delay_days to the completion date (converted to local date using current timezone). Skip logic MUST NOT be applied — the date is always relative to when the task was actually completed.

#### Scenario: After completion with delay 3 days
- **GIVEN** completed_at is "2026-01-15T10:00:00.000Z" and delay_days is 3
- **WHEN** system calculates next date
- **THEN** result is "2026-01-18"

#### Scenario: After completion uses current timezone
- **GIVEN** completed_at is "2026-01-15T23:00:00.000Z" in timezone "America/New_York" (Jan 15 18:00 local) and delay_days is 1
- **WHEN** system calculates next date
- **THEN** result is "2026-01-16" (based on local date Jan 15 + 1)

#### Scenario: After completion no skip logic even if date is past
- **GIVEN** completed_at is "2026-01-10T10:00:00.000Z" and delay_days is 1 and today is "2026-01-20"
- **WHEN** system calculates next date
- **THEN** result is "2026-01-11" (no skip, always completedDate + delay)

### Requirement: System calculates appear date from next date and advance days
# implements FR8 of repeating-tasks-specs

System MUST calculate appear_date as next_date minus advance_days. When advance_days is 0, appear_date equals next_date.

#### Scenario: Appear date with 0 advance days
- **GIVEN** next_date is "2026-02-15" and advance_days is 0
- **WHEN** system calculates appear date
- **THEN** result is "2026-02-15"

#### Scenario: Appear date with 7 advance days
- **GIVEN** next_date is "2026-02-15" and advance_days is 7
- **WHEN** system calculates appear date
- **THEN** result is "2026-02-08"

#### Scenario: Appear date with 30 advance days
- **GIVEN** next_date is "2026-03-01" and advance_days is 30
- **WHEN** system calculates appear date
- **THEN** result is "2026-01-30"

### Requirement: System creates a recurring copy on task completion
# implements FR9 of repeating-tasks-specs

When a task with repeat_rule is completed, system MUST: calculate next_date, calculate appear_date, create a new task copy with new UUID, reset is_completed to false, clear completed_at, set original_task_id to the chain origin, copy checklist items with new IDs and reset is_completed, mark for sync.

#### Scenario: Complete repeating task creates a copy
- **GIVEN** active task "Morning routine" with a daily repeat_rule
- **WHEN** user completes the task
- **THEN** a new task is created with same name, box, description, repeat_rule
- **AND** new task has a different ID, is_completed false, completed_at empty
- **AND** new task has calculated next_date and appear_date

#### Scenario: Recurring copy preserves original_task_id chain
- **GIVEN** task A (id="a", original_task_id="") is completed creating task B (original_task_id="a")
- **WHEN** task B is completed
- **THEN** task C has original_task_id="a" (chain origin, not "b")

#### Scenario: Recurring copy includes checklist items
- **GIVEN** task "Morning routine" has 3 checklist items (2 completed, 1 incomplete)
- **WHEN** user completes the task
- **THEN** new task has 3 checklist items with new IDs and all is_completed false

### Requirement: System manages hidden state of recurring copies
# implements FR10 of repeating-tasks-specs, FR7 of day-boundary

A recurring copy MUST be created with is_hidden=true if appear_date is after the logical date. Copy MUST be created with is_hidden=false if appear_date is on or before the logical date. Hidden tasks MUST NOT appear in box lists, search, or association queries. `TaskService.complete()` SHALL accept an optional `logicalDate` parameter; when provided, it SHALL use that date for the `shouldReveal` comparison instead of `clock.plainDateISO()`.

#### Scenario: Recurring copy hidden when appear_date is future
- **GIVEN** logical date is "2026-01-15" and calculated appear_date is "2026-01-20"
- **WHEN** system creates a recurring copy
- **THEN** copy has is_hidden true

#### Scenario: Recurring copy visible when appear_date is today
- **GIVEN** logical date is "2026-01-15" and calculated appear_date is "2026-01-15"
- **WHEN** system creates a recurring copy
- **THEN** copy has is_hidden false

#### Scenario: Recurring copy visible when appear_date is past
- **GIVEN** logical date is "2026-01-20" and calculated appear_date is "2026-01-15"
- **WHEN** system creates a recurring copy
- **THEN** copy has is_hidden false

#### Scenario: Logical date used when day boundary is non-midnight
- **GIVEN** day boundary is "02:00" and current time is 01:30 on June 5 (logical date June 4) and appear_date is "2026-06-05"
- **WHEN** system creates a recurring copy with logicalDate "2026-06-04"
- **THEN** copy has is_hidden true (appear_date > logicalDate)

#### Scenario: Backward compatibility without logicalDate
- **GIVEN** `complete()` is called without logicalDate parameter
- **WHEN** system evaluates shouldReveal
- **THEN** calendar date from `clock.plainDateISO()` is used

### Requirement: System reveals hidden tasks when appear date arrives
# implements FR11 of repeating-tasks-specs, FR4 of day-boundary

System MUST reveal hidden tasks (set is_hidden=false, mark for sync) when appear_date <= logical date. Reveal MUST be triggered on: app mount, day boundary transition (instead of midnight), sync_complete event, return from background (visibility change), and day boundary setting change.

#### Scenario: Reveal tasks whose appear_date has arrived
- **GIVEN** hidden task with appear_date "2026-01-15" and logical date is "2026-01-15"
- **WHEN** system runs reveal check
- **THEN** task has is_hidden false, needsSync true

#### Scenario: Do not reveal tasks whose appear_date is future
- **GIVEN** hidden task with appear_date "2026-01-20" and logical date is "2026-01-15"
- **WHEN** system runs reveal check
- **THEN** task remains hidden

#### Scenario: Reveal triggered on app mount
- **WHEN** app mounts
- **THEN** system runs reveal check with current logical date

#### Scenario: Reveal triggered at day boundary
- **WHEN** clock passes the configured day boundary time
- **THEN** system runs reveal check with new logical date

#### Scenario: Reveal triggered on day boundary change
- **WHEN** user changes the day boundary setting
- **THEN** system immediately runs reveal check with recalculated logical date

### Requirement: System uses current timezone for all date calculations
# implements FR12 of repeating-tasks-specs

All date calculations MUST use the current system timezone via `clock.timeZoneId()`. No timezone SHALL be stored in repeat_rule. When user changes timezone (travel), calculations MUST automatically adapt to the new timezone.

#### Scenario: Timezone change affects completed date interpretation
- **GIVEN** completed_at is "2026-01-16T03:00:00.000Z" and timezone is "Asia/Almaty" (Jan 16 09:00 local)
- **WHEN** system calculates next date for after_completion with delay_days 1
- **THEN** result is "2026-01-17"

#### Scenario: Same instant different timezone gives different date
- **GIVEN** completed_at is "2026-01-16T03:00:00.000Z"
- **WHEN** system calculates in "America/New_York" (Jan 15 22:00 local)
- **THEN** result date is based on Jan 15 (not Jan 16)

### Requirement: System updates existing hidden copy instead of creating duplicate
# implements FR13 of repeating-tasks-specs

When completing a repeating task, if a hidden recurring copy already exists (same original_task_id, is_hidden=true), system MUST update that copy's fields (next_date, appear_date, box, name, description) instead of creating a new one. This prevents duplicate hidden copies.

#### Scenario: Update existing hidden copy on re-completion
- **GIVEN** task A has repeat_rule and a hidden copy B already exists
- **WHEN** user completes task A again (e.g., after uncompleting and re-completing)
- **THEN** copy B is updated with new next_date and appear_date
- **AND** no additional copy is created

### Requirement: System recalculates next_date when repeat rule changes
# implements FR1 of repeating-task-rule-change

When a user changes the repeat_rule of a task, the system MUST recalculate next_date from the date of the change (not from the old next_date). This ensures the new rhythm starts from the moment the user made the change. The system MUST also recalculate appear_date based on the new next_date and advance_days.

#### Scenario: Daily interval change recalculates from date of change
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes interval to 5 on "2026-06-08"
- **THEN** next_date becomes "2026-06-13" (date of change + 5)

#### Scenario: Daily interval change with later completion preserves rhythm from change date
- **WHEN** task has daily interval=3 and next_date="2026-06-08"
- **AND** user changes interval to 5 on "2026-06-08"
- **AND** user completes the task on "2026-06-10"
- **THEN** new copy next_date is "2026-06-18" (2026-06-13 + 5, rhythm from change date)

#### Scenario: Frequency change from daily to weekly
- **WHEN** task has daily interval=1 and next_date="2026-06-08" (Monday)
- **AND** user changes to weekly weekdays=[3] (Wednesday) on "2026-06-08"
- **THEN** next_date becomes "2026-06-10" (nearest Wednesday from change date)

#### Scenario: Frequency change from daily to monthly
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes to monthly day_of_month=15 on "2026-06-08"
- **THEN** next_date becomes "2026-06-15" (nearest 15th from change date)

#### Scenario: Frequency change from daily to yearly
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes to yearly month_and_day={month:12, day:25} on "2026-06-08"
- **THEN** next_date becomes "2026-12-25" (nearest Dec 25 from change date)

#### Scenario: Weekly weekdays change
- **WHEN** task has weekly weekdays=[1] (Monday) and next_date="2026-06-08"
- **AND** user changes weekdays to [5] (Friday) on "2026-06-08"
- **THEN** next_date becomes "2026-06-12" (nearest Friday from change date)

#### Scenario: Frequency change from weekly to daily
- **WHEN** task has weekly weekdays=[1] and next_date="2026-06-08"
- **AND** user changes to daily interval=3 on "2026-06-08"
- **THEN** next_date becomes "2026-06-11" (change date + 3)

#### Scenario: Frequency change from monthly to daily
- **WHEN** task has monthly day_of_month=15 and next_date="2026-06-15"
- **AND** user changes to daily interval=2 on "2026-06-08"
- **THEN** next_date becomes "2026-06-10" (change date + 2)

### Requirement: System sets next_date to empty when changing to after_completion type
# implements FR2 of repeating-task-rule-change

When a user changes repeat_rule type from fixed to after_completion, the system MUST set next_date to empty string because the next date is unknown until the task is completed.

#### Scenario: Fixed to after_completion clears next_date
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes type to after_completion with delay_days=7
- **THEN** next_date becomes ""

#### Scenario: After_completion delay_days change keeps next_date empty
- **WHEN** task has after_completion delay_days=7 and next_date=""
- **AND** user changes delay_days to 14
- **THEN** next_date remains ""

### Requirement: System calculates next_date when changing from after_completion to fixed
# implements FR3 of repeating-task-rule-change

When a user changes repeat_rule type from after_completion to fixed, the system MUST calculate next_date from the date of the change using the new fixed rule.

#### Scenario: After_completion to fixed daily
- **WHEN** task has after_completion delay_days=7 and next_date=""
- **AND** user changes to daily interval=3 on "2026-06-08"
- **THEN** next_date becomes "2026-06-11" (change date + 3)

#### Scenario: After_completion to fixed weekly
- **WHEN** task has after_completion delay_days=7 and next_date=""
- **AND** user changes to weekly weekdays=[3] (Wednesday) on "2026-06-08" (Monday)
- **THEN** next_date becomes "2026-06-10" (nearest Wednesday from change date)

### Requirement: System preserves next_date when only advance_days or target_box changes
# implements FR4 of repeating-task-rule-change

When a user changes only advance_days or target_box (without changing frequency, interval, weekdays, day_of_month, month_and_day, or type), the system MUST NOT recalculate next_date. Only appear_date SHALL be recalculated when advance_days changes.

#### Scenario: Advance_days change only recalculates appear_date
- **WHEN** task has daily interval=3 and next_date="2026-06-11" and advance_days=0
- **AND** user changes advance_days to 2
- **THEN** next_date remains "2026-06-11"
- **AND** appear_date becomes "2026-06-09" (next_date - 2)

#### Scenario: Target_box change preserves next_date and appear_date
- **WHEN** task has daily interval=3 and next_date="2026-06-11" and target_box="today"
- **AND** user changes target_box to "week"
- **THEN** next_date remains "2026-06-11"
- **AND** appear_date remains unchanged

### Requirement: System shows confirmation dialog on repeat rule change
# implements FR5 of repeating-task-rule-change

When a user changes the repeat rule and the change affects next_date, the system MUST show a confirmation dialog displaying the calculated next date. The user MUST be able to cancel the change.

#### Scenario: Dialog shown with calculated date
- **WHEN** user changes daily interval from 1 to 5
- **THEN** system shows dialog with the new calculated next date
- **AND** user can confirm or cancel

#### Scenario: Dialog not shown for advance_days-only change
- **WHEN** user changes only advance_days
- **THEN** system saves the change without showing a dialog

### Requirement: Numeric input fields allow clearing before entering a new value
# implements FR7, FR8 of repeating-task-rule-change

All numeric inputs in RepeatRuleSelector (interval, delay_days, day_of_month, day, advance_days) MUST allow the user to clear the current value (via backspace or select-all + delete) before typing a new number. The field MAY be temporarily empty during editing. On blur, if the field is empty or invalid, the system MUST restore the last valid value clamped to the allowed range.

#### Scenario: User clears interval field and types new value
- **WHEN** interval input shows "3"
- **AND** user presses backspace to clear the field
- **THEN** the field becomes empty (not blocked)
- **AND** user types "4"
- **THEN** interval value is 4

#### Scenario: User leaves numeric field empty and blurs
- **WHEN** user clears a numeric input field
- **AND** user moves focus away (blur)
- **THEN** the field restores the last valid value

### Requirement: Test comments match actual day-of-week
# implements FR4 of fix-date-and-weekly-bugs

All date comments in skip-logic tests MUST accurately reflect the ISO day of week for the given date. Test expectations MUST be derived from independent date calculation, not from running the function under test.

#### Scenario: Comment accuracy verification
- **WHEN** test comment says "2026-05-10" is "Saturday"
- **THEN** the comment is incorrect (2026-05-10 is Sunday) and MUST be fixed

#### Scenario: Comment accuracy for 2026-04-18
- **WHEN** test comment says "2026-04-18" is "Friday"
- **THEN** the comment is incorrect (2026-04-18 is Saturday) and MUST be fixed

#### Scenario: Comment accuracy for 2026-04-07
- **WHEN** test comment says "2026-04-07" is "Monday"
- **THEN** the comment is incorrect (2026-04-07 is Tuesday) and MUST be fixed

### Requirement: System deduplicates recurring copies after pull
# implements FR1, FR2 of dedup-recurring-after-pull

After applying a pull batch, the system SHALL detect duplicate recurring copies — multiple non-completed, non-deleted tasks sharing the same `original_task_id`. Among duplicates, the system SHALL keep the winner by earliest `next_date`, tiebreak by lexicographically smallest `id`. Losers SHALL be soft-deleted with `syncStatus: "pending"`.

#### Scenario: Two duplicates with same next_date — tiebreak by id
- **GIVEN** task Copy-A (id="aaa...", original_task_id="root", next_date="2026-07-01") and Copy-B (id="bbb...", original_task_id="root", next_date="2026-07-01"), both non-completed, non-deleted
- **WHEN** deduplication runs after pull
- **THEN** Copy-A is kept (smaller id) and Copy-B is soft-deleted

#### Scenario: Two duplicates with different next_date — earlier wins
- **GIVEN** task Copy-A (original_task_id="root", next_date="2026-07-05") and Copy-B (original_task_id="root", next_date="2026-07-01"), both non-completed, non-deleted
- **WHEN** deduplication runs after pull
- **THEN** Copy-B is kept (earlier next_date) and Copy-A is soft-deleted

#### Scenario: No duplicates — no action
- **GIVEN** only one non-completed, non-deleted task per original_task_id
- **WHEN** deduplication runs after pull
- **THEN** no tasks are modified

#### Scenario: Completed copies are excluded from dedup
- **GIVEN** Copy-A (original_task_id="root", is_completed=true) and Copy-B (original_task_id="root", is_completed=false)
- **WHEN** deduplication runs after pull
- **THEN** no deduplication occurs (only one non-completed copy exists)

#### Scenario: Deleted copies are excluded from dedup
- **GIVEN** Copy-A (original_task_id="root", is_deleted=true) and Copy-B (original_task_id="root", is_deleted=false)
- **WHEN** deduplication runs after pull
- **THEN** no deduplication occurs (only one non-deleted copy exists)

### Requirement: Deduplication cascades soft-delete to checklist items
# implements FR3 of dedup-recurring-after-pull

When a duplicate recurring copy is soft-deleted during deduplication, the system SHALL also soft-delete all checklist items belonging to that copy. Each cascaded checklist item SHALL have `is_deleted: true`, `syncStatus: "pending"`, and `updated_at` set to the current timestamp.

#### Scenario: Duplicate with checklist items is soft-deleted
- **GIVEN** Copy-B is a duplicate loser with checklist items C1 and C2
- **WHEN** deduplication soft-deletes Copy-B
- **THEN** C1 has is_deleted=true, syncStatus="pending"
- **AND** C2 has is_deleted=true, syncStatus="pending"

#### Scenario: Duplicate without checklist items is soft-deleted
- **GIVEN** Copy-B is a duplicate loser with no checklist items
- **WHEN** deduplication soft-deletes Copy-B
- **THEN** only Copy-B is soft-deleted, no error occurs

### Requirement: Deduplication runs before sync_complete event
# implements FR4 of dedup-recurring-after-pull

Deduplication SHALL execute after the pull batch is applied to IndexedDB but BEFORE the `sync_complete` event is dispatched. This ensures `revealHiddenTasks` (which listens to `sync_complete`) never sees duplicate copies.

#### Scenario: Reveal sees clean data after dedup
- **GIVEN** pull batch contains two duplicates with appear_date <= today
- **WHEN** pull completes and sync_complete fires
- **THEN** revealHiddenTasks reveals only one task (the winner)

### Requirement: Deduplication is skipped when unnecessary
# implements FR5 of dedup-recurring-after-pull

Deduplication SHALL be skipped when the pull batch contains no tasks with non-empty `original_task_id`. This avoids unnecessary IndexedDB queries on normal pulls.

#### Scenario: Pull with no recurring data skips dedup
- **GIVEN** pull batch contains only tasks with original_task_id=""
- **WHEN** pull completes
- **THEN** deduplication query is not executed

### Requirement: System preserves promotion link when soft-deleting a recurring original
# implements FR1 of fix-recurring-restore

When soft-deleting a task that has active copies (promotion occurs), the system SHALL set `original_task_id` of the deleted task to the ID of the promoted copy before marking `is_deleted: true`. This preserves the link between the deleted task and its promoted successor for potential restore.

#### Scenario: softDelete records promoted copy ID in original_task_id
- **GIVEN** task A (id="a", original_task_id="", repeat_rule="daily") with active copy B (original_task_id="a")
- **WHEN** system soft-deletes task A
- **THEN** task B has original_task_id="" (promoted to original)
- **AND** task A has original_task_id="b" and is_deleted=true

#### Scenario: softDelete without copies does not change original_task_id
- **GIVEN** task A (id="a", original_task_id="", repeat_rule="daily") with no copies
- **WHEN** system soft-deletes task A
- **THEN** task A has original_task_id="" and is_deleted=true

#### Scenario: softDelete of non-recurring task does not change original_task_id
- **GIVEN** task A (id="a", original_task_id="", repeat_rule="") with no copies
- **WHEN** system soft-deletes task A
- **THEN** task A has original_task_id="" and is_deleted=true

### Requirement: System prevents duplicate chains when restoring a recurring task
# implements FR2, FR3, FR4, FR5 of fix-recurring-restore

When restoring a soft-deleted task, the system SHALL check whether a promotion occurred (task has non-empty `original_task_id` AND non-empty `repeat_rule`). If the promoted successor is alive (exists and not deleted), the system SHALL clear `repeat_rule`, `next_date`, and `appear_date` on the restored task — it becomes a regular (non-recurring) task. If the promoted successor is deleted or does not exist, the system SHALL clear `original_task_id` and restore the task as a chain original with its `repeat_rule` intact.

#### Scenario: Restore with active promoted successor clears repeat_rule
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and active task B (id="b", original_task_id="", repeat_rule="daily", is_deleted=false)
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, repeat_rule="", next_date="", appear_date=""
- **AND** task A has original_task_id="b" (preserved as copy reference)

#### Scenario: Restore with deleted promoted successor restores as original
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and deleted task B (id="b", is_deleted=true)
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, original_task_id="", repeat_rule="daily"

#### Scenario: Restore with non-existent promoted successor restores as original
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and task B does not exist
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, original_task_id="", repeat_rule="daily"

#### Scenario: Restore with hidden promoted successor clears repeat_rule
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and task B (id="b", is_hidden=true, is_deleted=false)
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, repeat_rule="", next_date="", appear_date=""

#### Scenario: Restore task without repeat_rule is unchanged
- **GIVEN** deleted task A (original_task_id="", repeat_rule="")
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false (no other fields changed)

#### Scenario: Restore copy (non-original) is unchanged
- **GIVEN** deleted task B (original_task_id="a", repeat_rule="daily") where B was a copy (not promoted)
- **AND** original_task_id was set before deletion (not by promotion)
- **WHEN** system restores task B
- **THEN** task B has is_deleted=false with original_task_id="a" and repeat_rule="daily" preserved
