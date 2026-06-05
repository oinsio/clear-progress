Feature: Recurring copy visibility respects logical date
  Implements FR7 of day-boundary.

  @day-boundary @FR7
  Scenario: Recurring copy hidden when appear date is after logical date
    Given logical date is "2026-01-15"
    And a repeating task with calculated appear date "2026-01-20"
    When user completes the repeating task
    Then the recurring copy is hidden

  @day-boundary @FR7
  Scenario: Recurring copy visible when appear date matches logical date
    Given logical date is "2026-01-15"
    And a repeating task with calculated appear date "2026-01-15"
    When user completes the repeating task
    Then the recurring copy is visible

  @day-boundary @FR7
  Scenario: Logical date used when day boundary is non-midnight
    Given day boundary is "02:00"
    And current local time is "01:30" on "2026-06-05"
    And a repeating task with calculated appear date "2026-06-05"
    When user completes the repeating task with logical date "2026-06-04"
    Then the recurring copy is hidden

  @day-boundary @FR7
  Scenario: Backward compatibility without logical date parameter
    Given a repeating task with calculated appear date "2026-01-15"
    When user completes the repeating task without logical date
    Then the recurring copy visibility is determined by calendar date from clock
