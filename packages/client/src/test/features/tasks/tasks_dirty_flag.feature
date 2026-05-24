Feature: Task Dirty Flag
  Implements FR1 of task-core-specs.

  @task-core-specs @FR1
  Scenario: Smart dirty flag on actual update
    Given task "Buy groceries" exists with needsSync false
    When user updates task name to "Buy vegetables"
    Then task has needsSync true
    And task updated_at is refreshed

  @task-core-specs @FR1
  Scenario: No-op update does not set dirty flag
    Given task "Buy groceries" exists with needsSync false
    When user updates task name to "Buy groceries"
    Then task has needsSync false
    And task updated_at is unchanged

  @task-core-specs @FR1
  Scenario: Dirty flag on create
    When user creates task "New task" in box "inbox"
    Then task has needsSync true

  @task-core-specs @FR1
  Scenario: Dirty flag on soft-delete
    Given task "Buy groceries" exists with needsSync false
    When user soft-deletes the task
    Then task has needsSync true

  @task-core-specs @FR1
  Scenario: Dirty flag on restore
    Given soft-deleted task "Buy groceries" exists with needsSync false
    When user restores the task
    Then task has needsSync true

  @task-core-specs @FR1
  Scenario: Dirty flag on complete
    Given task "Buy groceries" exists with needsSync false
    When user completes the task
    Then task has needsSync true
