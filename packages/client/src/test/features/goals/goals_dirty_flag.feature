Feature: Goals Dirty Flag
  Implements FR9, FR10 of add-goals-specs.
  Smart dirty flag: identical updates do not mark for sync.

  @add-goals-specs @FR9
  Scenario: No-op update does not trigger sync
    Given goal "Learn Rust" exists with syncStatus "synced"
    When user updates goal name to "Learn Rust"
    Then goal syncStatus remains "synced"
    And goal updated_at is unchanged

  @add-goals-specs @FR10
  Scenario: Reorder marks only moved goal for sync
    Given goals A, B, C with ascending sort_order
    When user moves goal C between A and B
    Then goal A has syncStatus "synced"
    And goal B has syncStatus "synced"
    And goal C has syncStatus "pending"
