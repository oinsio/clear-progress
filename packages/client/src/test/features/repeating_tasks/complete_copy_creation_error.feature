Feature: Completion does not mislabel copy-creation errors as invalid rules
  Implements FR1, FR2, FR3 of fix-recurring-completion-error-masking.

  @fix-recurring-completion-error-masking @FR1 @FR2
  Scenario: Copy creation fails for a task with a valid repeat rule
    Given a recurring task with a valid repeat rule
    When the task is completed and an unexpected error occurs while creating the next occurrence
    Then the task is marked as completed
    And the recurring result status is "error_creating_copy"
    And the error is logged to the console

  @fix-recurring-completion-error-masking @FR3
  Scenario: No false invalid-rule alert is raised when copy creation fails
    Given a recurring task with a valid repeat rule
    When the task is completed and an unexpected error occurs while creating the next occurrence
    Then the user is not shown a repeat rule invalid alert
