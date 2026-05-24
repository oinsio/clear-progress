Feature: Task Associations
  Implements FR8 of task-core-specs.

  @task-core-specs @FR8
  Scenario: Get tasks by goal
    Given 2 tasks with goal "g1" and 1 task with goal "g2"
    When user gets tasks by goal "g1"
    Then 2 tasks are returned sorted by sort_order

  @task-core-specs @FR8
  Scenario: Get tasks by context excludes completed
    Given 1 incomplete and 1 completed task with context "c1"
    When user gets tasks by context "c1"
    Then only 1 incomplete task is returned

  @task-core-specs @FR8
  Scenario: Get tasks by category
    Given 2 incomplete tasks with category "cat1"
    When user gets tasks by category "cat1"
    Then 2 tasks are returned sorted by sort_order

  @task-core-specs @FR8
  Scenario: Goal task counts
    Given 3 active incomplete tasks with goals "g1", "g1", "g2"
    When user gets goal task counts
    Then counts are g1=2 and g2=1

  @task-core-specs @FR8
  Scenario: Tasks with empty goal_id not counted
    Given 1 active incomplete task with empty goal_id
    When user gets goal task counts
    Then empty counts returned
