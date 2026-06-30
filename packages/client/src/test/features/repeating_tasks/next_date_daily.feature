Feature: Next Date Daily Calculation
  Implements FR3 of repeating-tasks-specs.

  @repeating-tasks-specs @FR3
  Scenario: Daily interval 1 next day
    Given previous next_date is "2026-01-15" and today is "2026-01-15"
    When system calculates next date with daily interval 1
    Then result is "2026-01-16"

  @repeating-tasks-specs @FR3
  Scenario: Daily interval 3
    Given previous next_date is "2026-01-15" and today is "2026-01-15"
    When system calculates next date with daily interval 3
    Then result is "2026-01-18"

  @repeating-tasks-specs @FR3
  Scenario: Daily skip logic skips missed days
    Given previous next_date is "2026-01-10" and today is "2026-01-20"
    When system calculates next date with daily interval 3
    Then result is "2026-01-23"

  @add-recurring-edge-case-tests @FR7
  Scenario: Daily early completion prev greater than today
    Given previous next_date is "2026-07-05" and today is "2026-07-03"
    When system calculates next date with daily interval 1
    Then result is "2026-07-04"

  @repeating-tasks-specs @FR3 @add-recurring-edge-case-tests @FR8
  Scenario: Daily skip logic exact alignment
    Given previous next_date is "2026-01-01" and today is "2026-01-07"
    When system calculates next date with daily interval 3
    Then result is "2026-01-10"
