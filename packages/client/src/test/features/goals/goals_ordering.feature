Feature: Goals Ordering
  Implements FR6, FR10 of add-goals-specs.

  @add-goals-specs @desc-sort-order @FR6 @FR10
  Scenario: Reorder places goal at new position via fractional key
    Given goals A, B, C with ascending sort_order
    When user moves goal A before goal C
    Then goals are ordered A, C, B

  @add-goals-specs @desc-sort-order @FR6 @FR10
  Scenario: Reorder marks moved goal for sync
    Given goals A, B, C with ascending sort_order
    When user moves goal A before goal C
    Then goal A has syncStatus "pending"
    And goal C has syncStatus "synced"
    And goal B has syncStatus "synced"

  @add-goals-specs @desc-sort-order @FR6 @FR10
  Scenario: Reorder throws for non-existent goal
    Given goals A, B with ascending sort_order
    When user reorders non-existent goal
    Then an error is thrown
