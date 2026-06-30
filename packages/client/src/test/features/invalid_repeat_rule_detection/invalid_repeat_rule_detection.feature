Feature: Invalid repeat rule detection
  Implements FR1, FR2, FR5 of detect-invalid-repeat-rule.

  @detect-invalid-repeat-rule @FR1
  Scenario: Non-empty repeat_rule that fails parsing is detected as invalid
    Given a task with repeat_rule '{"type":"unknown"}'
    When isRepeatRuleInvalid is called
    Then it returns true

  @detect-invalid-repeat-rule @FR1
  Scenario: Empty repeat_rule is not detected as invalid
    Given a task with repeat_rule ""
    When isRepeatRuleInvalid is called
    Then it returns false

  @detect-invalid-repeat-rule @FR1
  Scenario: Valid repeat_rule is not detected as invalid
    Given a task with a valid daily repeat_rule
    When isRepeatRuleInvalid is called
    Then it returns false

  @detect-invalid-repeat-rule @FR2
  Scenario: Completing task with invalid repeat_rule returns skipped status
    Given an active task with invalid repeat_rule
    When the task is completed
    Then the recurringResult status is "skipped_invalid_rule"
    And the task is marked as completed

  @detect-invalid-repeat-rule @FR2
  Scenario: Completing task with valid repeat_rule returns created status
    Given an active task with valid daily repeat_rule
    When the task is completed
    Then the recurringResult status is "created"

  @detect-invalid-repeat-rule @FR2
  Scenario: Completing non-recurring task returns not_recurring status
    Given an active task with empty repeat_rule
    When the task is completed
    Then the recurringResult status is "not_recurring"

  @detect-invalid-repeat-rule @FR5
  Scenario: Pull diff with invalid repeat rule triggers alert
    Given a pulled task "Water plants" with invalid repeat_rule
    And the task is active and incomplete
    When the post-pull check runs
    Then the result contains "Water plants"

  @detect-invalid-repeat-rule @FR5
  Scenario: Deleted task with invalid rule is excluded
    Given a pulled task "Deleted task" with invalid repeat_rule
    And the task is deleted
    When the post-pull check runs
    Then the result is empty

  @detect-invalid-repeat-rule @FR5
  Scenario: Completed task with invalid rule is excluded
    Given a pulled task "Done task" with invalid repeat_rule
    And the task is completed
    When the post-pull check runs
    Then the result is empty
