Feature: Hidden Task Visibility on Creation
  Implements FR10 of repeating-tasks-specs.

  @repeating-tasks-specs @FR10
  Scenario: Recurring copy hidden when appear_date is future
    Given today is "2026-06-15" and advance_days is 0
    When system creates a recurring copy
    Then copy has is_hidden true

  @repeating-tasks-specs @FR10
  Scenario: Recurring copy visible when appear_date is today
    Given today is "2026-06-15" and advance_days is 1
    When system creates a recurring copy
    Then copy has is_hidden false

  @repeating-tasks-specs @FR10
  Scenario: Recurring copy visible when appear_date is past
    Given today is "2026-06-15" and advance_days is 5
    When system creates a recurring copy
    Then copy has is_hidden false
