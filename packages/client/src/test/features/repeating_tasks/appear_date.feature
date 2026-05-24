@repeating-tasks-specs @FR8
Feature: Appear Date Calculation
  Implements FR8 of repeating-tasks-specs.

  Scenario: Appear date with 0 advance days
    Given next_date is "2026-02-15" and advance_days is 0
    When system calculates appear date
    Then result is "2026-02-15"

  Scenario: Appear date with 7 advance days
    Given next_date is "2026-02-15" and advance_days is 7
    When system calculates appear date
    Then result is "2026-02-08"

  Scenario: Appear date with 30 advance days
    Given next_date is "2026-03-01" and advance_days is 30
    When system calculates appear date
    Then result is "2026-01-30"
