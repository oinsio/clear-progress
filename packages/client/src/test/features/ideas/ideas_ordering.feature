Feature: Ideas Ordering
  Implements FR6, FR10 of add-ideas-specs.

  @add-ideas-specs @FR6 @FR10
  Scenario: Reorder assigns sequential sort_order
    Given ideas A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders ideas to B, C, A
    Then idea B has sort_order 0
    And idea C has sort_order 1
    And idea A has sort_order 2

  @add-ideas-specs @FR6 @FR10
  Scenario: Only changed ideas marked for sync
    Given ideas A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders ideas to A, C, B
    Then idea A has needsSync false
    And idea C has needsSync true
    And idea B has needsSync true

  @add-ideas-specs @FR6 @FR10
  Scenario: Empty reorder is no-op
    Given ideas A with sort_order 0, B with sort_order 1, C with sort_order 2
    When user reorders with empty array
    Then idea A has needsSync false
    And idea B has needsSync false
    And idea C has needsSync false

  @add-ideas-specs @FR6 @FR10
  Scenario: Same order is no-op
    Given ideas A with sort_order 0, B with sort_order 1
    When user reorders ideas to A, B
    Then idea A has needsSync false
    And idea B has needsSync false
