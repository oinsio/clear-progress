Feature: Next Date Monthly Calculation
  Implements FR5 of repeating-tasks-specs.

  @repeating-tasks-specs @FR5
  Scenario: Monthly interval 1
    Given previous next_date is "2026-01-15" with day_of_month 15 and today is "2026-01-15"
    When system calculates next date with monthly interval 1
    Then result is "2026-02-15"

  @repeating-tasks-specs @FR5
  Scenario: Monthly end-of-month clamping
    Given previous next_date is "2026-01-31" with day_of_month 31 and today is "2026-01-31"
    When system calculates next date with monthly interval 1
    Then result is "2026-02-28"

  @repeating-tasks-specs @FR5
  Scenario: Monthly skip logic skips past months
    Given previous next_date is "2026-01-15" with day_of_month 15 and today is "2026-04-20"
    When system calculates next date with monthly interval 1
    Then result is "2026-05-15"

  @repeating-tasks-specs @FR5
  Scenario: Monthly interval 3 skip logic
    Given previous next_date is "2026-01-15" with day_of_month 15 and today is "2026-06-01"
    When system calculates next date with monthly interval 3
    Then result is "2026-07-15"
