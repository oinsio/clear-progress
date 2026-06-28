Feature: Categories Ordering
  Implements FR6 of add-context-category-specs.

  @add-context-category-specs @FR6
  Scenario: Reorder places category at new position via fractional key
    Given categories A, B, C with ascending sort_order
    When user moves category C before category A
    Then categories are ordered C, A, B

  @add-context-category-specs @FR6
  Scenario: Reorder marks moved category for sync
    Given categories A, B, C with ascending sort_order
    When user moves category C before category A
    Then category C has syncStatus "pending"
    And category A has syncStatus "synced"
    And category B has syncStatus "synced"

  @add-context-category-specs @FR6
  Scenario: Reorder throws for non-existent category
    Given categories A, B with ascending sort_order
    When user reorders non-existent category
    Then an error is thrown
