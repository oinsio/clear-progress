Feature: Ideas Ordering
  Implements FR6, FR10 of add-ideas-specs.

  @add-ideas-specs @desc-sort-order @FR6 @FR10
  Scenario: Reorder places idea at new position via fractional key
    Given ideas A, B, C with ascending sort_order
    When user moves idea A before idea C
    Then ideas are ordered A, C, B

  @add-ideas-specs @desc-sort-order @FR6 @FR10
  Scenario: Reorder marks moved idea for sync
    Given ideas A, B, C with ascending sort_order
    When user moves idea A before idea C
    Then idea A has syncStatus "pending"
    And idea C has syncStatus "synced"
    And idea B has syncStatus "synced"

  @add-ideas-specs @desc-sort-order @FR6 @FR10
  Scenario: Reorder throws for non-existent idea
    Given ideas A, B with ascending sort_order
    When user reorders non-existent idea
    Then an error is thrown
