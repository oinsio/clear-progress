# Delta: day-boundary — fix-today-completed-logical-date

## MODIFIED Requirements

### Requirement: Logical date computation from day boundary
# implements FR1, FR2 of fix-today-completed-logical-date

The system SHALL provide a `getLogicalDate(clock, dayBoundary)` function that returns the current logical date. If the current local time is before `dayBoundary`, the function SHALL return the previous calendar day. If the current local time is at or after `dayBoundary`, the function SHALL return the current calendar day. When `dayBoundary` is `"00:00"`, the function SHALL always return the current calendar day (fast path).

**Changed behavior**: ActiveTasksPage todayCompleted MUST classify a task as "completed today" by comparing the `completed_at` instant against the start of the logical day (logical today at `dayBoundary` in the user's timezone), never by comparing date strings. A UTC string slice of `completed_at` (`slice(0, 10)`) MUST NOT be used on either side of the comparison. ActiveTasksPage MUST obtain the "today" group via `groupCompletedTasks().todayTasks` so that ActiveTasksPage and CompletedPage classify tasks identically.

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
- **THEN** todayCompleted includes the task (both are June 5 in local timezone)

#### Scenario: todayCompleted includes early-morning completion whose UTC date is yesterday
- **WHEN** user timezone is UTC+5 (Asia/Almaty), current UTC time is 2026-06-09T21:30:00Z (local 02:30 June 10), day boundary is "00:00"
- **AND** task was completed at 2026-06-09T21:00:00Z (local 02:00 June 10)
- **THEN** todayCompleted includes the task even though the UTC date of `completed_at` is June 9

#### Scenario: todayCompleted includes evening completion whose UTC date is tomorrow
- **WHEN** user timezone is UTC-4 (America/New_York, summer), current UTC time is 2026-06-10T01:30:00Z (local 21:30 June 9), day boundary is "00:00"
- **AND** task was completed at 2026-06-10T01:00:00Z (local 21:00 June 9)
- **THEN** todayCompleted includes the task even though the UTC date of `completed_at` is June 10

#### Scenario: todayCompleted includes post-boundary completion whose UTC date is yesterday (custom boundary)
- **WHEN** user timezone is UTC+5, day boundary is "04:00", current UTC time is 2026-06-10T07:00:00Z (local 12:00 June 10 — after boundary, logical day is June 10)
- **AND** task was completed at 2026-06-09T23:30:00Z (local 04:30 June 10 — after the 04:00 boundary, UTC date June 9)
- **THEN** todayCompleted includes the task (completed after the June 10 logical day started at 04:00 local, even though the UTC date of `completed_at` is June 9)

#### Scenario: todayCompleted respects custom day boundary
- **WHEN** user timezone is UTC+5, day boundary is "04:00", current UTC time is 2026-06-09T21:30:00Z (local 02:30 June 10 — before boundary, logical day is June 9)
- **AND** task was completed at 2026-06-09T05:00:00Z (local 10:00 June 9)
- **THEN** todayCompleted includes the task (completed after the June 9 logical day started at 04:00 local)

#### Scenario: todayCompleted excludes yesterday's tasks
- **WHEN** user timezone is UTC+5, current UTC time is 2026-06-05T01:00:00Z (local 06:00 June 5)
- **AND** task was completed at 2026-06-04T10:00:00Z (local 15:00 June 4)
- **THEN** todayCompleted does NOT include the task

#### Scenario: todayCompleted excludes tasks without completed_at
- **WHEN** a task has `is_completed = true` and `completed_at = ""`
- **THEN** todayCompleted does NOT include the task
