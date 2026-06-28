Feature: Task Duplicate
  Implements FR7 of task-core-specs.

  @task-core-specs @FR7
  Scenario: Duplicate a task
    Given task "Buy groceries" in inbox with description "weekly"
    When user duplicates the task
    Then a new task exists with name "Buy groceries" and description "weekly"
    And new task has a different id
    And new task has syncStatus "pending"

  @task-core-specs @FR7
  Scenario: Duplicate copies checklist items
    Given task "Buy groceries" has 2 checklist items
    When user duplicates the task
    Then new task has 2 checklist items with new ids

  @task-core-specs @FR7
  Scenario: Duplicate nonexistent task throws error
    When user duplicates nonexistent task
    Then error "Task not found" is thrown

  @hide-tasks @FR10
  Scenario: Duplicating a hidden task creates a visible copy
    Given a hidden task "Renew passport" with appear_date "2027-06-01"
    When user duplicates the task
    Then new task has is_hidden false
    And new task has appear_date ""
