Feature: Ideas Ordering
  Implements FR6, FR10 of add-ideas-specs.

  @add-ideas-specs @FR6 @FR10
  Scenario: Reorder places idea at new position via fractional key
    Given ideas A, B, C with ascending sort_order
    When user moves idea C before idea A
    Then ideas are ordered C, A, B

  @add-ideas-specs @FR6 @FR10
  Scenario: Reorder marks moved idea for sync
    Given ideas A, B, C with ascending sort_order
    When user moves idea C before idea A
    Then idea C has needsSync true
    And idea A has needsSync false
    And idea B has needsSync false

  @add-ideas-specs @FR6 @FR10
  Scenario: Reorder throws for non-existent idea
    Given ideas A, B with ascending sort_order
    When user reorders non-existent idea
    Then an error is thrown
