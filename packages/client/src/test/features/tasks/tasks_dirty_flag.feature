Feature: Task Dirty Flag
  Implements FR1 of task-core-specs.

  @task-core-specs @FR1
  Scenario: Smart dirty flag on actual update
    Given task "Buy groceries" exists with syncStatus "synced"
    When user updates task name to "Buy vegetables"
    Then task has syncStatus "pending"
    And task updated_at is refreshed

  @task-core-specs @FR1
  Scenario: No-op update does not set dirty flag
    Given task "Buy groceries" exists with syncStatus "synced"
    When user updates task name to "Buy groceries"
    Then task has syncStatus "synced"
    And task updated_at is unchanged

  @task-core-specs @FR1
  Scenario: Dirty flag on create
    When user creates task "New task" in box "inbox"
    Then task has syncStatus "pending"

  @task-core-specs @FR1
  Scenario: Dirty flag on soft-delete
    Given task "Buy groceries" exists with syncStatus "synced"
    When user soft-deletes the task
    Then task has syncStatus "pending"

  @task-core-specs @FR1
  Scenario: Dirty flag on restore
    Given soft-deleted task "Buy groceries" exists with syncStatus "synced"
    When user restores the task
    Then task has syncStatus "pending"

  @task-core-specs @FR1
  Scenario: Dirty flag on complete
    Given task "Buy groceries" exists with syncStatus "synced"
    When user completes the task
    Then task has syncStatus "pending"
