# Capability: Upcoming Recurrence Preview

## Purpose

Calculation and display of upcoming recurrence dates in the UI: the concrete next recurrence date in task details and a preview of 5 dates when configuring a rule.

## ADDED Requirements

### Requirement: System calculates a list of upcoming dates for a repeat rule
# implements FR8 of show-upcoming-recurrences

System SHALL provide a utility `calculateUpcomingDates(rule, startDate, count, clock)` that returns an array of `count` ISO date strings representing the next occurrences. Each date SHALL be computed sequentially: the first date is `startDate`, each subsequent date is derived from the previous using the unified next-date algorithm in `from-schedule` mode. For `after_completion` type, the utility SHALL return an empty array.

#### Scenario: Calculate 5 upcoming dates for weekly Mon+Wed interval 2
- **WHEN** rule is weekly, interval=2, weekdays=[1,3], startDate="2026-07-07" (Monday)
- **THEN** result is ["2026-07-07", "2026-07-09", "2026-07-21", "2026-07-23", "2026-08-04"]

#### Scenario: Calculate 3 upcoming dates for daily interval 3
- **WHEN** rule is daily, interval=3, startDate="2026-07-01", today is "2026-07-01"
- **THEN** result is ["2026-07-01", "2026-07-04", "2026-07-07"]

#### Scenario: Calculate upcoming dates for monthly with clamping
- **WHEN** rule is monthly, interval=1, day_of_month=31, startDate="2026-01-31"
- **THEN** result includes "2026-02-28" (clamped) and "2026-03-31"

#### Scenario: After completion returns empty array
- **WHEN** rule is after_completion, delay_days=3
- **THEN** result is []

### Requirement: System formats next_date with relative and absolute formats
# implements FR3, FR4 of show-upcoming-recurrences

System SHALL format a date-only ISO string into a human-readable string using the current locale. The format SHALL be relative for near dates and absolute for others:
- If date equals today -> localized "today" (i18n key)
- If date equals tomorrow -> localized "tomorrow" (i18n key)
- If date is in the current year -> `weekday short, day month short` (e.g., "Wed, Jul 2")
- If date is in a different year -> `day month short year` (e.g., "Jan 15, 2027")
- For daily frequency (FR4) -> weekday SHALL be omitted

#### Scenario: Format date that is today
- **WHEN** next_date is "2026-07-01" and today is "2026-07-01"
- **THEN** formatted result is localized "today"

#### Scenario: Format date that is tomorrow
- **WHEN** next_date is "2026-07-02" and today is "2026-07-01"
- **THEN** formatted result is localized "tomorrow"

#### Scenario: Format date in current year with weekday
- **WHEN** next_date is "2026-07-08" (Wednesday) and today is "2026-07-01" and frequency is weekly
- **THEN** formatted result includes short weekday and short month (e.g., "Wed, Jul 8")

#### Scenario: Format date in current year for daily frequency without weekday
- **WHEN** next_date is "2026-07-08" and today is "2026-07-01" and frequency is daily
- **THEN** formatted result does NOT include weekday (e.g., "Jul 8")

#### Scenario: Format date in different year
- **WHEN** next_date is "2027-01-15" and today is "2026-07-01"
- **THEN** formatted result includes year (e.g., "Jan 15, 2027")

### Requirement: System formats upcoming dates for preview list
# implements FR7 of show-upcoming-recurrences

System SHALL format dates for the preview list using absolute format only (no relative "today"/"tomorrow"). Format: `weekday short, day month short`. For daily frequency, weekday SHALL be omitted. Year SHALL be included only when the date is in a different year from today.

#### Scenario: Format preview date with weekday
- **WHEN** preview date is "2026-07-08" (Wednesday) and frequency is weekly
- **THEN** formatted result is "Wed, Jul 8" (locale-dependent)

#### Scenario: Format preview date for daily without weekday
- **WHEN** preview date is "2026-07-08" and frequency is daily
- **THEN** formatted result is "Jul 8" (locale-dependent, no weekday)

### Requirement: TaskDetailsTab displays next_date for repeating tasks
# implements FR1, FR2 of show-upcoming-recurrences

TaskDetailsTab SHALL display the formatted `next_date` below the repeat rule DrillDownRow when the task has a non-empty `repeat_rule`. If `next_date` is non-empty, the date SHALL be formatted using the relative format (today/tomorrow/absolute). If `next_date` is empty (after_completion type not yet completed), the text SHALL show a localized "after completion" message. The text SHALL use secondary styling (smaller font, muted color).

#### Scenario: Show formatted next_date for task with fixed rule
- **WHEN** task has repeat_rule (fixed, daily) and next_date="2026-07-15" and today is "2026-07-01"
- **THEN** TaskDetailsTab shows "Jul 15" below the repeat rule row

#### Scenario: Show "after completion" when next_date is empty
- **WHEN** task has repeat_rule (after_completion) and next_date=""
- **THEN** TaskDetailsTab shows localized "after completion" text

#### Scenario: Do not show next_date row when no repeat rule
- **WHEN** task has no repeat_rule
- **THEN** TaskDetailsTab does NOT show a next_date row

### Requirement: RepeatRuleSelector displays preview of upcoming dates
# implements FR5, FR6, FR9 of show-upcoming-recurrences

RepeatRuleSelector SHALL display a list of 5 upcoming dates at the bottom of the frequency configuration step when the rule is fully configured (all required fields are filled). The list SHALL update immediately when any rule parameter changes. For `after_completion` type, the preview SHALL NOT be shown.

#### Scenario: Show 5 preview dates for configured weekly rule
- **WHEN** user has selected weekly, interval=1, weekdays=[1,5] and rule is fully configured
- **THEN** selector shows a list of 5 upcoming dates formatted with weekday

#### Scenario: Update preview when interval changes
- **WHEN** user changes weekly interval from 1 to 2
- **THEN** preview dates update immediately to reflect the new interval

#### Scenario: Hide preview for after_completion type
- **WHEN** user selects after_completion type
- **THEN** no preview dates are shown

#### Scenario: Hide preview when required fields are missing
- **WHEN** user has selected weekly but has not chosen any weekdays
- **THEN** no preview dates are shown
