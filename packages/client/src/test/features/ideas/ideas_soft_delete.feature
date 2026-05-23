Feature: Ideas Soft Delete
  Implements FR4, FR5 of add-ideas-specs.

  @add-ideas-specs @FR4
  Scenario: Soft-delete an idea
    Given active idea "Learn Rust" exists
    When user soft-deletes idea "Learn Rust"
    Then idea "Learn Rust" has is_deleted true
    And idea "Learn Rust" has needsSync true

  @add-ideas-specs @FR5
  Scenario: Restore a soft-deleted idea
    Given soft-deleted idea "Learn Rust" exists
    When user restores idea "Learn Rust"
    Then idea "Learn Rust" has is_deleted false
    And idea "Learn Rust" has needsSync true

  @add-ideas-specs @FR4 @FR2
  Scenario: Soft-deleted idea excluded from active list
    Given active idea "Learn Rust" is soft-deleted
    When user views idea list
    Then "Learn Rust" does not appear in the list
