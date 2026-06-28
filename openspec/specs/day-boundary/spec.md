# Capability: Day Boundary

## Purpose

Logical date computation based on a configurable day boundary time. Allows users who work past midnight to treat late-night hours as part of the previous day. Affects task reveal, completed task grouping, date formatting, and recurring task scheduling.

## Requirements

### Requirement: Logical date computation from day boundary
# implements FR3 of day-boundary

The system SHALL provide a `getLogicalDate(clock, dayBoundary)` function that returns the current logical date. If the current local time is before `dayBoundary`, the function SHALL return the previous calendar day. If the current local time is at or after `dayBoundary`, the function SHALL return the current calendar day. When `dayBoundary` is `"00:00"`, the function SHALL always return the current calendar day (fast path).

**Changed behavior**: ActiveTasksPage todayCompleted filter MUST use `getLogicalDate(clock, dayBoundary)` instead of `new Date().toISOString().slice(0, 10)` for determining the current day. This aligns it with `groupCompletedTasks()` which already uses `getLogicalDate`.

#### Scenario: Midnight boundary returns calendar date
- **WHEN** day boundary is "00:00" and current time is any time of day
- **THEN** logical date equals the calendar date from `clock.plainDateISO()`

#### Scenario: Before boundary returns previous day
- **WHEN** day boundary is "02:00" and current local time is 01:30 on June 5
- **THEN** logical date is June 4

#### Scenario: At boundary returns current day
- **WHEN** day boundary is "02:00" and current local time is 02:00 on June 5
- **THEN** logical date is June 5

#### Scenario: After boundary returns current day
- **WHEN** day boundary is "02:00" and current local time is 14:00 on June 5
- **THEN** logical date is June 5

#### Scenario: Large boundary value
- **WHEN** day boundary is "06:00" and current local time is 05:59 on June 5
- **THEN** logical date is June 4

#### Scenario: Respects current timezone
- **WHEN** day boundary is "02:00" and timezone is "Asia/Tokyo" and current time is 01:00 JST on June 5
- **THEN** logical date is June 4 (computed in Tokyo timezone)

#### Scenario: todayCompleted uses logical date in non-UTC timezone
- **WHEN** user timezone is UTC+5, current UTC time is 2026-06-05T01:00:00Z (local 06:00), day boundary is "00:00"
- **AND** task was completed at 2026-06-05T00:30:00Z (local 05:30 on June 5)
- **THEN** todayCompleted filter includes the task (both are June 5 in local timezone)

#### Scenario: todayCompleted excludes yesterday's tasks
- **WHEN** user timezone is UTC+5, current UTC time is 2026-06-05T01:00:00Z (local 06:00 June 5)
- **AND** task was completed at 2026-06-04T10:00:00Z (local 15:00 June 4)
- **THEN** todayCompleted filter does NOT include the task

### Requirement: Day boundary validation
# implements FR11 of day-boundary

The system SHALL validate day boundary values. Valid values MUST match the HH:mm format with hours 00-23 and minutes 00-59. Invalid values (empty string, wrong format, out of range) SHALL be rejected.

#### Scenario: Valid boundary values
- **WHEN** validating "00:00", "02:30", "23:59", "12:00"
- **THEN** all are valid

#### Scenario: Invalid boundary values
- **WHEN** validating "24:00", "abc", "", "2:00", "-1:00", "12:60"
- **THEN** all are invalid

### Requirement: Day boundary self-healing on invalid value
# implements FR12 of day-boundary

When `SettingsService.getDayBoundary()` reads a value from storage that fails validation (`isValidDayBoundary` returns false), it SHALL return `DEFAULT_DAY_BOUNDARY` ("00:00") and asynchronously overwrite the invalid value in the repository with the default, marking it `needsSync: true`. This ensures the corrected value propagates to the server and other devices.

#### Scenario: Invalid value in storage returns default
- **WHEN** stored day_boundary value is "invalid"
- **THEN** `getDayBoundary()` returns "00:00"

#### Scenario: Invalid value triggers self-healing write
- **WHEN** stored day_boundary value is "25:00"
- **THEN** the repository is updated with key "day_boundary", value "00:00", needsSync true

#### Scenario: Valid value passes through unchanged
- **WHEN** stored day_boundary value is "02:00"
- **THEN** `getDayBoundary()` returns "02:00" and no healing write occurs

#### Scenario: Missing value returns default without healing
- **WHEN** no day_boundary setting exists in storage
- **THEN** `getDayBoundary()` returns "00:00" and no write occurs

### Requirement: Hidden task reveal uses logical date
# implements FR4 of day-boundary

The `HiddenTaskService.revealHiddenTasks()` SHALL accept an optional `logicalDate` parameter. When provided, it SHALL use that date instead of the calendar date for the reveal comparison (`appear_date <= logicalDate`). When omitted, it SHALL fall back to `clock.plainDateISO()` for backward compatibility.

#### Scenario: Reveal with explicit logical date
- **WHEN** hidden task has appear_date "2026-06-05" and logicalDate is "2026-06-04"
- **THEN** task is NOT revealed (appear_date > logicalDate)

#### Scenario: Reveal with explicit logical date matching appear_date
- **WHEN** hidden task has appear_date "2026-06-05" and logicalDate is "2026-06-05"
- **THEN** task is revealed (appear_date <= logicalDate)

#### Scenario: Backward compatibility without logicalDate
- **WHEN** revealHiddenTasks is called without logicalDate
- **THEN** calendar date from clock is used as "today"

### Requirement: Reveal timer fires at day boundary
# implements FR5 of day-boundary

The reveal timer SHALL schedule the next reveal check at the day boundary time (in the user's timezone) instead of midnight. When the day boundary setting changes, the timer SHALL be recalculated immediately.

#### Scenario: Timer scheduled for non-midnight boundary
- **WHEN** day boundary is "02:00" and current time is 23:00
- **THEN** timer is set for 02:00 the next calendar day (3 hours + buffer)

#### Scenario: Timer rescheduled on boundary change
- **WHEN** day boundary changes from "00:00" to "02:00"
- **THEN** existing timer is cleared and new timer is set for the next 02:00 occurrence

### Requirement: Immediate reveal check on boundary change
# implements FR6 of day-boundary

When the day boundary setting changes, the system SHALL immediately run a reveal check with the new logical date. This ensures tasks that become eligible under the new boundary appear without waiting for the timer.

#### Scenario: Boundary shifted backward reveals tasks
- **WHEN** boundary changes from "02:00" to "00:00" at 01:00 on June 5
- **THEN** logical date shifts from June 4 to June 5
- **AND** tasks with appear_date "2026-06-05" are revealed immediately

#### Scenario: Boundary shifted forward does not un-reveal
- **WHEN** boundary changes from "00:00" to "02:00" at 01:00 on June 5
- **THEN** logical date shifts from June 5 to June 4
- **AND** already-revealed tasks remain visible (reveal is irreversible)

### Requirement: Completed tasks grouping uses day boundary
# implements FR8 of day-boundary

`groupCompletedTasks` SHALL accept an optional `dayBoundary` parameter (default `"00:00"`). Group boundaries (start of Today, Yesterday, etc.) SHALL use the `dayBoundary` time instead of midnight. The "today" reference date SHALL be computed via `getLogicalDate`.

#### Scenario: Task completed before boundary grouped as previous day
- **WHEN** day boundary is "02:00" and task was completed at 01:30 on June 5
- **THEN** task is grouped under June 4 (the logical day)

#### Scenario: Default boundary preserves current behavior
- **WHEN** day boundary is "00:00" (default)
- **THEN** grouping behaves identically to current midnight-based logic

### Requirement: Date formatting uses day boundary
# implements FR9 of day-boundary

`formatCompletedAt` and `formatShortDateTime` SHALL accept an optional `dayBoundary` parameter. "Today" and "Yesterday" labels SHALL be computed relative to the logical date and boundary time.

#### Scenario: Today label before boundary
- **WHEN** day boundary is "02:00" and current time is 01:30 June 5 and task was completed at 23:00 June 4
- **THEN** format shows "Today" (both times are in logical day June 4)

#### Scenario: Default boundary preserves labels
- **WHEN** day boundary is "00:00"
- **THEN** Today/Yesterday labels behave identically to current logic

### Requirement: Settings page shows day boundary picker
# implements FR10 of day-boundary

The Settings page SHALL include a "Day start time" section with an `<input type="time">` control. The section SHALL appear after the "Default box" section. The input SHALL validate values and reject invalid times.

#### Scenario: Day boundary setting displayed
- **WHEN** user opens Settings page
- **THEN** "Day start time" section is visible with current boundary value

#### Scenario: User changes day boundary
- **WHEN** user selects "02:00" in the time picker
- **THEN** the setting is saved, synced, and takes effect immediately

#### Scenario: Default value shown for new users
- **WHEN** no day_boundary setting exists
- **THEN** the picker shows "00:00"
