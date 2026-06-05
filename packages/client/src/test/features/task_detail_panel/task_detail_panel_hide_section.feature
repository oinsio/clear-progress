Feature: Task detail panel hide section visibility
  Implements FR4, FR5, UX4, UX5 of hide-tasks.

  @hide-tasks @FR4 @UX4
  Scenario: Non-recurring task shows hide until row
    Given a task without repeat rule
    When hide section visibility is evaluated
    Then the hide until row should be visible

  @hide-tasks @FR5
  Scenario: Recurring task does not show hide until row
    Given a task with a repeat rule
    When hide section visibility is evaluated
    Then the hide until row should not be visible

  @hide-tasks @UX5
  Scenario: Hidden task shows appear date in row value
    Given a hidden task with appear date "2026-09-01"
    When hide section visibility is evaluated
    Then the hide row value is "2026-09-01"
    And the hide row has value indicator

  @hide-tasks @FR4
  Scenario: Non-hidden task shows empty hide row value
    Given a task without repeat rule
    And the task is not hidden
    When hide section visibility is evaluated
    Then the hide row value is ""
    And the hide row has no value indicator
