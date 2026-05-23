Feature: Contexts Ordering
  Implements FR6 of add-context-category-specs.

  @add-context-category-specs @FR6
  Scenario: Reorder assigns sequential sort_order
    Given contexts A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders contexts to B, C, A
    Then context B has sort_order 0
    And context C has sort_order 1
    And context A has sort_order 2

  @add-context-category-specs @FR6
  Scenario: Only changed contexts marked for sync
    Given contexts A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders contexts to A, C, B
    Then context A has needsSync false
    And context C has needsSync true
    And context B has needsSync true

  @add-context-category-specs @FR6
  Scenario: Empty reorder is no-op
    Given contexts A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders with empty array
    Then context A has needsSync false
    And context B has needsSync false
    And context C has needsSync false

  @add-context-category-specs @FR6
  Scenario: Same order is no-op
    Given contexts A with sort_order 0, B with sort_order 1
    When user reorders contexts to A, B
    Then context A has needsSync false
    And context B has needsSync false
