Feature: Contexts Ordering
  Implements FR6 of add-context-category-specs.

  @add-context-category-specs @desc-sort-order @FR6
  Scenario: Reorder places context at new position via fractional key
    Given contexts A, B, C with ascending sort_order
    When user moves context A before context C
    Then contexts are ordered A, C, B

  @add-context-category-specs @desc-sort-order @FR6
  Scenario: Reorder marks moved context for sync
    Given contexts A, B, C with ascending sort_order
    When user moves context A before context C
    Then context A has syncStatus "pending"
    And context C has syncStatus "synced"
    And context B has syncStatus "synced"

  @add-context-category-specs @desc-sort-order @FR6
  Scenario: Reorder throws for non-existent context
    Given contexts A, B with ascending sort_order
    When user reorders non-existent context
    Then an error is thrown
