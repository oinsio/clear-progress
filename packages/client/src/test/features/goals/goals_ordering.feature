Feature: Goals Ordering
  Implements FR6, FR10 of add-goals-specs.

  @add-goals-specs @FR6 @FR10
  Scenario: Reorder places goal at new position via fractional key
    Given goals A, B, C with ascending sort_order
    When user moves goal C before goal A
    Then goals are ordered C, A, B

  @add-goals-specs @FR6 @FR10
  Scenario: Reorder marks moved goal for sync
    Given goals A, B, C with ascending sort_order
    When user moves goal C before goal A
    Then goal C has syncStatus "pending"
    And goal A has syncStatus "synced"
    And goal B has syncStatus "synced"

  @add-goals-specs @FR6 @FR10
  Scenario: Reorder throws for non-existent goal
    Given goals A, B with ascending sort_order
    When user reorders non-existent goal
    Then an error is thrown
