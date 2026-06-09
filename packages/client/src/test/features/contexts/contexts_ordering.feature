Feature: Contexts Ordering
  Implements FR6 of add-context-category-specs.

  @add-context-category-specs @FR6
  Scenario: Reorder places context at new position via fractional key
    Given contexts A, B, C with ascending sort_order
    When user moves context C before context A
    Then contexts are ordered C, A, B

  @add-context-category-specs @FR6
  Scenario: Reorder marks moved context for sync
    Given contexts A, B, C with ascending sort_order
    When user moves context C before context A
    Then context C has needsSync true
    And context A has needsSync false
    And context B has needsSync false

  @add-context-category-specs @FR6
  Scenario: Reorder throws for non-existent context
    Given contexts A, B with ascending sort_order
    When user reorders non-existent context
    Then an error is thrown
