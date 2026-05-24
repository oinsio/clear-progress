Feature: Task Duplicate
  Implements FR7 of task-core-specs.

  @task-core-specs @FR7
  Scenario: Duplicate a task
    Given task "Buy groceries" in inbox with description "weekly"
    When user duplicates the task
    Then a new task exists with name "Buy groceries" and description "weekly"
    And new task has a different id
    And new task has needsSync true

  @task-core-specs @FR7
  Scenario: Duplicate copies checklist items
    Given task "Buy groceries" has 2 checklist items
    When user duplicates the task
    Then new task has 2 checklist items with new ids

  @task-core-specs @FR7
  Scenario: Duplicate nonexistent task throws error
    When user duplicates nonexistent task
    Then error "Task not found" is thrown
