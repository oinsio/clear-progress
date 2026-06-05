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
# implements FR3 of repeating-tasks-specs

System MUST add interval days to previous next_date. If result is in the past (user was inactive), system MUST apply skip logic: compute nearest future date aligned to interval periods.

#### Scenario: Daily interval 1 next day
- **GIVEN** previous next_date is "2026-01-15" and today is "2026-01-15"
- **WHEN** system calculates next date with daily interval 1
- **THEN** result is "2026-01-16"

#### Scenario: Daily interval 3
- **GIVEN** previous next_date is "2026-01-15" and today is "2026-01-15"
- **WHEN** system calculates next date with daily interval 3
- **THEN** result is "2026-01-18"

#### Scenario: Daily skip logic skips missed days
- **GIVEN** previous next_date is "2026-01-10" and today is "2026-01-20"
- **WHEN** system calculates next date with daily interval 3
- **THEN** result is "2026-01-22" (next aligned date >= today)

#### Scenario: Daily skip logic exact alignment
- **GIVEN** previous next_date is "2026-01-01" and today is "2026-01-07"
- **WHEN** system calculates next date with daily interval 3
- **THEN** result is "2026-01-07" (exactly today, aligned to interval)

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
# implements FR6 of repeating-tasks-specs

System MUST advance by interval years to the specified month_and_day. If target date is Feb 29 in a non-leap year, system MUST clamp to Feb 28. Skip logic MUST skip past years if target year is in the past.

#### Scenario: Yearly interval 1
- **GIVEN** previous next_date is "2026-03-20" and month_and_day {month: 3, day: 20} and today is "2026-03-20"
- **WHEN** system calculates next date with yearly interval 1
- **THEN** result is "2027-03-20"

#### Scenario: Yearly Feb 29 in non-leap year
- **GIVEN** previous next_date is "2024-02-29" and month_and_day {month: 2, day: 29} and today is "2024-02-29"
- **WHEN** system calculates next date with yearly interval 1
- **THEN** result is "2025-02-28" (2025 is not a leap year)

#### Scenario: Yearly skip logic skips past years
- **GIVEN** previous next_date is "2024-06-15" and month_and_day {month: 6, day: 15} and today is "2027-01-01"
- **WHEN** system calculates next date with yearly interval 1
- **THEN** result is "2027-06-15"

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
