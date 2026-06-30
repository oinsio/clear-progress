Feature: Next Date Weekly Calculation
  Implements FR4 of repeating-tasks-specs.

  @repeating-tasks-specs @FR4
  Scenario: Weekly single weekday
    Given previous next_date is "2026-01-05" with weekdays [1] and today is "2026-01-05"
    When system calculates next date with weekly interval 1
    Then result is "2026-01-12"

  @repeating-tasks-specs @FR4
  Scenario: Weekly multiple weekdays
    Given previous next_date is "2026-01-05" with weekdays [1, 3, 5] and today is "2026-01-05"
    When system calculates next date with weekly interval 1
    Then result is "2026-01-07"

  @repeating-tasks-specs @FR4
  Scenario: Weekly interval 2
    Given previous next_date is "2026-01-05" with weekdays [1] and today is "2026-01-05"
    When system calculates next date with weekly interval 2
    Then result is "2026-01-19"

  @add-recurring-edge-case-tests @FR4
  Scenario: Weekly early completion preserves scheduled date
    Given previous next_date is "2026-07-06" with weekdays [1] and today is "2026-07-04"
    When system calculates next date with weekly interval 1
    Then result is "2026-07-06"

  @add-recurring-edge-case-tests @FR4
  Scenario: Weekly early completion with interval 2 preserves scheduled date
    Given previous next_date is "2026-07-06" with weekdays [1] and today is "2026-07-04"
    When system calculates next date with weekly interval 2
    Then result is "2026-07-06"

  @repeating-tasks-specs @FR4
  Scenario: Weekly skip logic skips missed weeks
    Given previous next_date is "2026-01-05" with weekdays [1] and today is "2026-02-01"
    When system calculates next date with weekly interval 1
    Then result is "2026-02-02"

  @unify-next-date-calculation @FR5
  Scenario: First creation of biweekly task finds nearest matching day
    Given no previous next_date with weekdays [1] and today is "2026-06-27"
    When system calculates next date with weekly interval 2
    Then result is "2026-06-29"

  @unify-next-date-calculation @FR5
  Scenario: First creation of triweekly task with multiple weekdays finds nearest day
    Given no previous next_date with weekdays [1, 3, 5] and today is "2026-06-25"
    When system calculates next date with weekly interval 3
    Then result is "2026-06-26"

  @unify-next-date-calculation @FR5
  Scenario: First creation of weekly interval 4 wraps to next week nearest day
    Given no previous next_date with weekdays [1, 3] and today is "2026-06-27"
    When system calculates next date with weekly interval 4
    Then result is "2026-06-29"
