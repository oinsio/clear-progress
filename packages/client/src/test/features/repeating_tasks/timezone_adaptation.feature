Feature: Timezone Adaptation
  Implements FR12 of repeating-tasks-specs.

  @repeating-tasks-specs @FR12
  Scenario: Timezone change affects completed date interpretation
    Given completed_at is "2026-01-16T03:00:00.000Z" and timezone is "Asia/Almaty"
    When system calculates next date for after_completion with delay_days 1
    Then result is "2026-01-17"

  @repeating-tasks-specs @FR12
  Scenario: Same instant different timezone gives different date
    Given completed_at is "2026-01-16T03:00:00.000Z" and timezone is "America/New_York"
    When system calculates next date for after_completion with delay_days 1
    Then result is "2026-01-16"
