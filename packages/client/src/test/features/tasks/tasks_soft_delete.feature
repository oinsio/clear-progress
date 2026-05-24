Feature: Task Soft Delete and Cascade
  Implements FR1, FR9, FR10 of task-core-specs.

  @task-core-specs @FR1
  Scenario: Soft-delete a task
    Given active task "Buy groceries" exists
    When user soft-deletes the task
    Then task has is_deleted true
    And task has needsSync true

  @task-core-specs @FR1
  Scenario: Restore a soft-deleted task
    Given soft-deleted task "Buy groceries" exists
    When user restores the task
    Then task has is_deleted false
    And task has needsSync true

  @task-core-specs @FR9
  Scenario: Cascade soft-delete to checklist items
    Given task "Buy groceries" has 3 checklist items
    When user soft-deletes the task
    Then all 3 checklist items have is_deleted true and needsSync true

  @task-core-specs @FR10
  Scenario: Cascade restore to checklist items
    Given soft-deleted task "Buy groceries" has 3 soft-deleted checklist items
    When user restores the task
    Then all 3 checklist items have is_deleted false and needsSync true

  @task-core-specs @FR9
  Scenario: Soft-delete task with no checklist items
    Given active task "Buy groceries" exists without checklist items
    When user soft-deletes the task
    Then task has is_deleted true
