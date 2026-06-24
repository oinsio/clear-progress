Feature: CompletedPage operation routing
  Implements FR3 of miss-behavior-specs.

  @miss-behavior-specs @FR3
  Scenario: Update dispatches to task's original box
    Given a completed task in the "inbox" box
    When the task is updated
    Then the update is routed to the inbox handler

  @miss-behavior-specs @FR3
  Scenario: Move dispatches to task's original box
    Given a completed task in the "week" box
    When the task is moved to "today"
    Then the move is routed to the week handler

  @miss-behavior-specs @FR3
  Scenario: Delete clears selection and dispatches to original box
    Given a completed task in the "later" box
    When the task is deleted
    Then selection is cleared
    And the delete is routed to the later handler

  @miss-behavior-specs @FR3
  Scenario: Duplicate selects the new task
    Given a completed task in the "today" box
    When the task is duplicated
    Then the new task becomes selected

  @miss-behavior-specs @FR3
  Scenario: Unknown box falls back to today handler
    Given a completed task with an unrecognized box "unknown"
    When the task is updated
    Then the update is routed to the today handler
