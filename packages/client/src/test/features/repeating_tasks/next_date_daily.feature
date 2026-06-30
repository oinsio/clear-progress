Feature: Next Date Daily Calculation
  Implements FR1, FR2, FR3, FR4 of align-daily-to-calendar-rhythm.

  @align-daily-to-calendar-rhythm @FR1
  Scenario: Daily interval 1 normal completion
    Given previous next_date is "2026-07-01" and today is "2026-07-01" and completed_at date is "2026-07-01"
    When system calculates next date with daily interval 1
    Then result is "2026-07-02"

  @align-daily-to-calendar-rhythm @FR2
  Scenario: Daily interval 1 early completion preserves schedule
    Given previous next_date is "2026-07-02" and today is "2026-07-01" and completed_at date is "2026-07-01"
    When system calculates next date with daily interval 1
    Then result is "2026-07-02"

  @align-daily-to-calendar-rhythm @FR3
  Scenario: Daily interval 1 late by 1 day skips to future
    Given previous next_date is "2026-07-01" and today is "2026-07-02" and completed_at date is "2026-07-02"
    When system calculates next date with daily interval 1
    Then result is "2026-07-03"

  @align-daily-to-calendar-rhythm @FR3
  Scenario: Daily interval 1 long inactivity skips to tomorrow
    Given previous next_date is "2026-07-01" and today is "2026-07-15" and completed_at date is "2026-07-15"
    When system calculates next date with daily interval 1
    Then result is "2026-07-16"

  @align-daily-to-calendar-rhythm @FR1
  Scenario: Daily interval 3 normal completion
    Given previous next_date is "2026-07-01" and today is "2026-07-01" and completed_at date is "2026-07-01"
    When system calculates next date with daily interval 3
    Then result is "2026-07-04"

  @align-daily-to-calendar-rhythm @FR2
  Scenario: Daily interval 3 early completion preserves schedule
    Given previous next_date is "2026-07-04" and today is "2026-07-02" and completed_at date is "2026-07-02"
    When system calculates next date with daily interval 3
    Then result is "2026-07-04"

  @align-daily-to-calendar-rhythm @FR3
  Scenario: Daily interval 3 late but candidate still in future
    Given previous next_date is "2026-07-01" and today is "2026-07-03" and completed_at date is "2026-07-03"
    When system calculates next date with daily interval 3
    Then result is "2026-07-04"

  @align-daily-to-calendar-rhythm @FR3
  Scenario: Daily interval 3 long inactivity skips by grid
    Given previous next_date is "2026-07-01" and today is "2026-07-15" and completed_at date is "2026-07-15"
    When system calculates next date with daily interval 3
    Then result is "2026-07-16"

  @align-daily-to-calendar-rhythm @FR3
  Scenario: Daily interval 3 long inactivity candidate equals today
    Given previous next_date is "2026-07-01" and today is "2026-07-16" and completed_at date is "2026-07-16"
    When system calculates next date with daily interval 3
    Then result is "2026-07-19"

  @align-daily-to-calendar-rhythm @FR4
  Scenario: Daily nearest-match on rule creation with interval 1
    Given today is "2026-07-01"
    When system calculates nearest-match for daily interval 1
    Then result is "2026-07-02"

  @align-daily-to-calendar-rhythm @FR4
  Scenario: Daily nearest-match on rule creation with interval 3
    Given today is "2026-07-01"
    When system calculates nearest-match for daily interval 3
    Then result is "2026-07-04"

  @align-daily-to-calendar-rhythm @FR4
  Scenario: Daily nearest-match on rule change resets rhythm
    Given today is "2026-07-03"
    When system calculates nearest-match for daily interval 2
    Then result is "2026-07-05"
