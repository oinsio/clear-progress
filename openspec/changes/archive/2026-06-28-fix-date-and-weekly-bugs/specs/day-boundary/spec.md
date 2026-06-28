## MODIFIED Requirements

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

#### Scenario: todayCompleted uses logical date in non-UTC timezone
- **WHEN** user timezone is UTC+5, current UTC time is 2026-06-05T01:00:00Z (local 06:00), day boundary is "00:00"
- **AND** task was completed at 2026-06-05T00:30:00Z (local 05:30 on June 5)
- **THEN** todayCompleted filter includes the task (both are June 5 in local timezone)

#### Scenario: todayCompleted excludes yesterday's tasks
- **WHEN** user timezone is UTC+5, current UTC time is 2026-06-05T01:00:00Z (local 06:00 June 5)
- **AND** task was completed at 2026-06-04T10:00:00Z (local 15:00 June 4)
- **THEN** todayCompleted filter does NOT include the task
