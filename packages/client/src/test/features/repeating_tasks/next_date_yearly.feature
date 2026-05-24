Feature: Next Date Yearly Calculation
  Implements FR6 of repeating-tasks-specs.

  @repeating-tasks-specs @FR6
  Scenario: Yearly interval 1
    Given previous next_date is "2026-03-20" with month 3 day 20 and today is "2026-03-20"
    When system calculates next date with yearly interval 1
    Then result is "2027-03-20"

  @repeating-tasks-specs @FR6
  Scenario: Yearly Feb 29 in non-leap year
    Given previous next_date is "2024-02-29" with month 2 day 29 and today is "2024-02-29"
    When system calculates next date with yearly interval 1
    Then result is "2025-02-28"

  @repeating-tasks-specs @FR6
  Scenario: Yearly skip logic skips past years
    Given previous next_date is "2024-06-15" with month 6 day 15 and today is "2027-01-01"
    When system calculates next date with yearly interval 1
    Then result is "2027-06-15"
