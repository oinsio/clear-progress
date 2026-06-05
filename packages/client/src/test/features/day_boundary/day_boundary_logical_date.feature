Feature: Logical date computation from day boundary
  Implements FR3 of day-boundary.

  @day-boundary @FR3
  Scenario: Midnight boundary returns calendar date
    Given day boundary is "00:00"
    And current local time is "14:00" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-05"

  @day-boundary @FR3
  Scenario: Before boundary returns previous day
    Given day boundary is "02:00"
    And current local time is "01:30" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-04"

  @day-boundary @FR3
  Scenario: At boundary returns current day
    Given day boundary is "02:00"
    And current local time is "02:00" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-05"

  @day-boundary @FR3
  Scenario: After boundary returns current day
    Given day boundary is "02:00"
    And current local time is "14:00" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-05"

  @day-boundary @FR3
  Scenario: Large boundary value
    Given day boundary is "06:00"
    And current local time is "05:59" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-04"

  @day-boundary @FR3
  Scenario: Respects current timezone
    Given day boundary is "02:00"
    And timezone is "Asia/Tokyo"
    And current local time is "01:00" on "2026-06-05"
    When system computes the logical date
    Then logical date is "2026-06-04"
