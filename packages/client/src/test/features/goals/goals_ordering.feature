Feature: Goals Ordering
  Implements FR6, FR10 of add-goals-specs.

  @add-goals-specs @FR6 @FR10
  Scenario: Reorder assigns sequential sort_order
    Given goals A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders goals to B, C, A
    Then goal B has sort_order 0
    And goal C has sort_order 1
    And goal A has sort_order 2

  @add-goals-specs @FR6 @FR10
  Scenario: Only changed goals marked for sync
    Given goals A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders goals to A, C, B
    Then goal A has needsSync false
    And goal C has needsSync true
    And goal B has needsSync true

  @add-goals-specs @FR6 @FR10
  Scenario: Empty reorder is no-op
    Given goals A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders with empty array
    Then goal A has needsSync false
    And goal B has needsSync false
    And goal C has needsSync false

  @add-goals-specs @FR6 @FR10
  Scenario: Same order is no-op
    Given goals A with sort_order 0, B with sort_order 1
    When user reorders goals to A, B
    Then goal A has needsSync false
    And goal B has needsSync false
