Feature: Completed-today section stays fresh across a day rollover
  Implements FR2, FR3 of fix-completed-today-stale-on-day-rollover.

  @fix-completed-today-stale-on-day-rollover @FR3
  Scenario: Completed-today section clears yesterday's task at the boundary
    Given day boundary is "00:00"
    And a task was completed at "20:00" on "2026-06-04"
    And the app is subscribed to the current logical date
    And current local time is "20:30" on "2026-06-04"
    Then the task appears in the "completed today" section
    When the clock advances to "00:30" on "2026-06-05" and the boundary timer fires
    Then the task no longer appears in the "completed today" section

  @fix-completed-today-stale-on-day-rollover @FR3
  Scenario: Custom day boundary respected for rollover
    Given day boundary is "04:00"
    And a task was completed at "10:00" on "2026-06-04"
    And the app is subscribed to the current logical date
    And current local time is "10:30" on "2026-06-04"
    Then the task appears in the "completed today" section
    When the clock advances to "04:00" on "2026-06-05" and the boundary timer fires
    Then the task no longer appears in the "completed today" section

  @fix-completed-today-stale-on-day-rollover @FR2
  Scenario: No emit when re-armed but the logical date is unchanged
    Given day boundary is "00:00"
    And the app is subscribed to the current logical date
    And current local time is "10:00" on "2026-06-04"
    When the boundary timer fires without the date changing
    Then no change is emitted to subscribers
