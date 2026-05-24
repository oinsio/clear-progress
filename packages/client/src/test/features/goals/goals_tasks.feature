Feature: Goals Tasks Grouping
  Implements FR12, FR13, UX1, UX2 of add-goals-specs.

  @add-goals-specs @FR12
  Scenario: Goal has active and completed tasks
    Given goal "Learn Rust" has 3 active tasks and 2 completed tasks
    When user views goal tasks
    Then 3 active tasks are returned
    And 2 completed tasks are returned

  @add-goals-specs @FR12
  Scenario: Completed tasks sorted by completion date
    Given goal has task A completed at "2026-01-01T10:00:00.000Z" and task B completed at "2026-01-01T11:00:00.000Z"
    When user views completed tasks
    Then task B appears before task A

  @add-goals-specs @FR12
  Scenario: Completed tasks fallback to sort_order descending
    Given goal has completed task A with sort_order 1 and task B with sort_order 3 without completed_at
    When user views completed tasks
    Then task B appears before task A

  @add-goals-specs @FR12
  Scenario: Goal with no tasks
    Given goal "New goal" has no associated tasks
    When user views goal tasks
    Then empty task list is returned

  @add-goals-specs @FR13 @UX1 @UX2
  Scenario: Completed tasks hidden by default
    Given goal "Learn Rust" has 2 active tasks and 1 completed task
    When user views goal detail with default settings
    Then only active tasks are visible
    And completed tasks are hidden
