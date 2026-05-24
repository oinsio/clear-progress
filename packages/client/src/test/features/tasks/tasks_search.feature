Feature: Task Search
  Implements FR6 of task-core-specs.

  @task-core-specs @FR6
  Scenario: Search by name
    Given tasks "Buy groceries" and "Read book" exist
    When user searches for "buy"
    Then only "Buy groceries" is returned

  @task-core-specs @FR6
  Scenario: Search by description
    Given task with description "weekly shopping list" exists
    When user searches for "shopping"
    Then the task is returned

  @task-core-specs @FR6
  Scenario: Search is case-insensitive
    Given task "Buy Groceries" exists
    When user searches for "buy groceries"
    Then the task is returned

  @task-core-specs @FR6
  Scenario: Incomplete tasks sorted before completed
    Given incomplete task "Task A" and completed task "Task B" both match query "Task"
    When user searches for "Task"
    Then "Task A" appears before "Task B"

  @task-core-specs @FR6
  Scenario: No matches returns empty array
    When user searches for "nonexistent"
    Then empty array is returned
