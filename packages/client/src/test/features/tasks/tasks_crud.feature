Feature: Tasks CRUD
  Implements FR1 of task-core-specs.

  @task-core-specs @FR1
  Scenario: Create task with name and box
    When user creates task "Buy groceries" in box "inbox"
    Then task is persisted with name "Buy groceries"
    And task has box "inbox"
    And task has revision 0
    And task has syncStatus "pending"
    And task has is_deleted false
    And task has is_completed false

  @fractional-sort-order @FR3
  Scenario: New task created at top of box
    Given inbox has tasks with sort_order "a0", "a1", "a2"
    When user creates task "New task" in box "inbox"
    Then task has sort_order above "a2"

  @task-core-specs @FR1
  Scenario: UUID generated client-side
    When user creates task "Buy groceries" in box "inbox"
    Then task id is valid UUID v4

  @task-core-specs @FR1
  Scenario: Timestamps set on creation
    When user creates task "Buy groceries" in box "inbox"
    Then task created_at and updated_at are equal
    And task timestamps are ISO 8601 with Z suffix

  @task-core-specs @FR1
  Scenario: Optional fields default to empty string
    When user creates task "Buy groceries" in box "inbox"
    Then task has description ""
    And task has goal_id ""
    And task has context_id ""
    And task has category_id ""
    And task has repeat_rule ""
    And task has next_date ""
    And task has appear_date ""
    And task has original_task_id ""

  @task-core-specs @FR1
  Scenario: Read existing task
    Given task "Buy groceries" exists in box "inbox"
    When user reads task by id
    Then task is returned with name "Buy groceries"

  @task-core-specs @FR1
  Scenario: Read nonexistent task
    When user reads task by nonexistent id
    Then undefined is returned

  @task-core-specs @FR1
  Scenario: Update task name
    Given task "Buy groceries" exists in box "inbox"
    When user updates task name to "Buy vegetables"
    Then task name is "Buy vegetables"
    And task has syncStatus "pending"
    And task updated_at is refreshed

  @task-core-specs @FR1
  Scenario: Update nonexistent task throws error
    When user updates nonexistent task
    Then error "Task not found" is thrown
