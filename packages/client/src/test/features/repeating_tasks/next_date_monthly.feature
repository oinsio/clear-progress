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

  @add-recurring-edge-case-tests @FR5
  Scenario: Monthly early completion keeps scheduled date
    Given previous next_date is "2026-07-15" with day_of_month 15 and today is "2026-07-12"
    When system calculates next date with monthly interval 1
    Then result is "2026-07-15"

  @add-recurring-edge-case-tests @FR5
  Scenario: Monthly early completion cross-month keeps scheduled date
    Given previous next_date is "2026-08-01" with day_of_month 1 and today is "2026-07-28"
    When system calculates next date with monthly interval 1
    Then result is "2026-08-01"

  @add-recurring-edge-case-tests @FR9
  Scenario: Monthly clamping recovery from Feb 28 to Mar 31 for day 31
    Given previous next_date is "2026-02-28" with day_of_month 31 and today is "2026-02-28"
    When system calculates next date with monthly interval 1
    Then result is "2026-03-31"

  @add-recurring-edge-case-tests @FR10
  Scenario: Monthly clamping Jan 30 to Feb 28 for day 30
    Given previous next_date is "2026-01-30" with day_of_month 30 and today is "2026-01-30"
    When system calculates next date with monthly interval 1
    Then result is "2026-02-28"

  @add-recurring-edge-case-tests @FR11
  Scenario: Monthly clamping recovery from Feb 28 to Mar 30 for day 30
    Given previous next_date is "2026-02-28" with day_of_month 30 and today is "2026-02-28"
    When system calculates next date with monthly interval 1
    Then result is "2026-03-30"
