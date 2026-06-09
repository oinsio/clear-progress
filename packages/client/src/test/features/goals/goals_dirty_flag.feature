Feature: Goals Dirty Flag
  Implements FR9, FR10 of add-goals-specs.
  Smart dirty flag: identical updates do not mark for sync.

  @add-goals-specs @FR9
  Scenario: No-op update does not trigger sync
    Given goal "Learn Rust" exists with needsSync false
    When user updates goal name to "Learn Rust"
    Then goal needsSync remains false
    And goal updated_at is unchanged

  @add-goals-specs @FR10
  Scenario: Reorder marks only moved goal for sync
    Given goals A, B, C with ascending sort_order
    When user moves goal C between A and B
    Then goal A has needsSync false
    And goal B has needsSync false
    And goal C has needsSync true
