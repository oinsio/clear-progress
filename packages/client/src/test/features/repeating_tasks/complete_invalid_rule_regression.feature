Feature: Genuinely invalid repeat rules still surface the truthful alert
  Implements FR1, FR3 of fix-recurring-completion-error-masking.

  @fix-recurring-completion-error-masking @FR1
  Scenario: Completing a task with a genuinely unparseable repeat rule
    Given a recurring task with an unparseable repeat rule
    When the task is completed
    Then the recurring result status is "skipped_invalid_rule"

  @fix-recurring-completion-error-masking @FR3
  Scenario: The invalid-rule alert still appears for a genuinely unparseable rule
    Given a recurring task with an unparseable repeat rule
    When the task is completed
    Then the user is shown a repeat rule invalid alert for the task
