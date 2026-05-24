Feature: Task Reorder
  Implements FR5 of task-core-specs.

  @task-core-specs @FR5
  Scenario: Reorder assigns sequential sort_order
    Given tasks A, B, C with sort_order 0, 1, 2
    When user reorders to B, C, A
    Then B has sort_order 0
    And C has sort_order 1
    And A has sort_order 2

  @task-core-specs @FR5
  Scenario: Only changed tasks marked for sync
    Given tasks A, B, C with sort_order 0, 1, 2 and needsSync false
    When user reorders to A, C, B
    Then A has needsSync false
    And C has needsSync true
    And B has needsSync true

  @task-core-specs @FR5
  Scenario: Empty reorder is no-op
    When user reorders with empty array
    Then no database write occurs

  @task-core-specs @FR5
  Scenario: Same order is no-op
    Given tasks A, B with sort_order 0, 1 and needsSync false
    When user reorders to A, B
    Then A has needsSync false
    And B has needsSync false
