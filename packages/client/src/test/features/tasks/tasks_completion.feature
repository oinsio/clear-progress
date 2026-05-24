Feature: Task Completion
  Implements FR3, FR4 of task-core-specs.

  @task-core-specs @FR3
  Scenario: Complete a task
    Given active task "Buy groceries" exists
    When user completes the task
    Then task has is_completed true
    And task has completed_at set to current timestamp
    And task has needsSync true

  @task-core-specs @FR3
  Scenario: Uncomplete a task
    Given completed task "Buy groceries" exists
    When user uncompletes the task
    Then task has is_completed false
    And task has completed_at ""
    And task has needsSync true

  @task-core-specs @FR3
  Scenario: Complete nonexistent task throws error
    When user completes nonexistent task
    Then error "Task not found" is thrown

  @task-core-specs @FR3
  Scenario: Uncomplete nonexistent task throws error
    When user uncompletes nonexistent task
    Then error "Task not found" is thrown

  @task-core-specs @FR4
  Scenario: Completed tasks sorted by completed_at descending
    Given tasks completed at "2026-01-01T10:00:00.000Z" and "2026-01-02T10:00:00.000Z"
    When user views completed tasks
    Then task completed at "2026-01-02T10:00:00.000Z" appears first

  @task-core-specs @FR4
  Scenario: Soft-deleted excluded from completed list
    Given a completed task that is also soft-deleted
    When user views completed tasks
    Then empty array is returned
