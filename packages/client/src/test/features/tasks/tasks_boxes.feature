Feature: Task Boxes
  Implements FR2 of task-core-specs.

  @task-core-specs @FR2
  Scenario: Get tasks by box sorted by sort_order descending
    Given inbox has tasks with sort_order "a2", "a0", "a1"
    When user gets tasks by box "inbox"
    Then tasks are returned in descending sort_order

  @task-core-specs @FR2
  Scenario: Empty box returns empty array
    When user gets tasks by box "inbox"
    Then empty array is returned

  @task-core-specs @FR2
  Scenario: Soft-deleted tasks excluded from box
    Given inbox has 2 active tasks and 1 soft-deleted task
    When user gets tasks by box "inbox"
    Then only 2 tasks are returned

  @task-core-specs @FR2
  Scenario: Move task from inbox to today
    Given task "Buy groceries" exists in box "inbox"
    When user moves task to box "today"
    Then task has box "today"
    And task has syncStatus "pending"

  @task-core-specs @FR2
  Scenario: Move task to same box is no-op
    Given task "Buy groceries" exists in box "inbox" with syncStatus "synced"
    When user moves task to box "inbox"
    Then task has syncStatus "synced"
    And task updated_at is unchanged

  @fractional-sort-order @FR4
  Scenario: Moved task appears at top of destination box
    Given today has tasks with sort_order "a0", "a1"
    And task "Buy groceries" exists in box "inbox"
    When user moves task to box "today"
    Then task has sort_order above "a1"
