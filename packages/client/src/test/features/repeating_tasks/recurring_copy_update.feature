Feature: Recurring Copy Update
  Implements FR13 of repeating-tasks-specs.

  @repeating-tasks-specs @FR13
  Scenario: Update existing hidden copy on re-completion
    Given active task A with a daily repeat_rule and existing hidden copy B
    When user completes task A
    Then hidden copy B is updated with new next_date
    And no additional task is created
