Feature: Ideas Dirty Flag
  Implements FR9, FR10 of add-ideas-specs.
  Smart dirty flag: identical updates do not mark for sync.

  @add-ideas-specs @FR9
  Scenario: No-op update does not trigger sync
    Given idea "Learn Rust" exists with needsSync false
    When user updates idea name to "Learn Rust"
    Then idea needsSync remains false
    And idea updated_at is unchanged

  @add-ideas-specs @FR10
  Scenario: Reorder marks only moved idea for sync
    Given ideas A, B, C with ascending sort_order
    When user moves idea C between A and B
    Then idea A has needsSync false
    And idea B has needsSync false
    And idea C has needsSync true
