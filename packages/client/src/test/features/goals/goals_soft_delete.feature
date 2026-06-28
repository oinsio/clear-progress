Feature: Goals Soft Delete
  Implements FR4, FR5 of add-goals-specs.

  @add-goals-specs @FR4
  Scenario: Soft-delete a goal
    Given active goal "Learn Rust" exists
    When user soft-deletes goal "Learn Rust"
    Then goal "Learn Rust" has is_deleted true
    And goal "Learn Rust" has syncStatus "pending"

  @add-goals-specs @FR5
  Scenario: Restore a soft-deleted goal
    Given soft-deleted goal "Learn Rust" exists
    When user restores goal "Learn Rust"
    Then goal "Learn Rust" has is_deleted false
    And goal "Learn Rust" has syncStatus "pending"

  @add-goals-specs @FR4 @FR2
  Scenario: Soft-deleted goal excluded from active list
    Given active goal "Learn Rust" is soft-deleted
    When user views goal list
    Then "Learn Rust" does not appear in the list
