Feature: Task Reorder
  Implements FR2, FR6, FR9 of fractional-sort-order.

  @fractional-sort-order @FR6
  Scenario: Reorder updates only the dragged task
    Given task A with sort_order "a0"
    And task B with sort_order "a1"
    When user reorders task A to sort_order "a2"
    Then A has sort_order "a2"
    And A has needsSync true
    And B has sort_order "a1"

  @fractional-sort-order @FR2
  Scenario: Tasks within box sorted descending by sort_order
    Given inbox has tasks with sort_order "a2", "a0", "a1"
    When user gets tasks by box "inbox"
    Then tasks are returned in order "a2", "a1", "a0"

  @fractional-sort-order @FR6
  Scenario: Reorder nonexistent task throws error
    When user reorders nonexistent task
    Then error "Task not found" is thrown

  @fractional-sort-order @FR9
  Scenario: Reorder triggers rebalancing when key exceeds threshold
    Given tasks A, B in inbox with sort_order "a0", "a1"
    When user reorders task A with a long key exceeding threshold
    Then all tasks in inbox are rebalanced with fresh keys
