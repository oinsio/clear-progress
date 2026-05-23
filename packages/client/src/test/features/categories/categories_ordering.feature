Feature: Categories Ordering
  Implements FR6 of add-context-category-specs.

  @add-context-category-specs @FR6
  Scenario: Reorder assigns sequential sort_order
    Given categories A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders categories to B, C, A
    Then category B has sort_order 0
    And category C has sort_order 1
    And category A has sort_order 2

  @add-context-category-specs @FR6
  Scenario: Only changed categories marked for sync
    Given categories A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders categories to A, C, B
    Then category A has needsSync false
    And category C has needsSync true
    And category B has needsSync true

  @add-context-category-specs @FR6
  Scenario: Empty reorder is no-op
    Given categories A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders with empty array
    Then category A has needsSync false
    And category B has needsSync false
    And category C has needsSync false

  @add-context-category-specs @FR6
  Scenario: Same order is no-op
    Given categories A with sort_order 0, B with sort_order 1
    When user reorders categories to A, B
    Then category A has needsSync false
    And category B has needsSync false
