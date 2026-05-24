Feature: Next Date After Completion Calculation
  Implements FR7 of repeating-tasks-specs.

  @repeating-tasks-specs @FR7
  Scenario: After completion with delay 3 days
    Given completed_at is "2026-01-15T10:00:00.000Z" with delay_days 3
    When system calculates next date for after_completion
    Then result is "2026-01-18"

  @repeating-tasks-specs @FR7
  Scenario: After completion uses current timezone
    Given completed_at is "2026-01-15T23:00:00.000Z" with delay_days 1 in timezone "America/New_York"
    When system calculates next date for after_completion
    Then result is "2026-01-16"

  @repeating-tasks-specs @FR7
  Scenario: After completion no skip logic even if date is past
    Given completed_at is "2026-01-10T10:00:00.000Z" with delay_days 1 and today is "2026-01-20"
    When system calculates next date for after_completion
    Then result is "2026-01-11"
