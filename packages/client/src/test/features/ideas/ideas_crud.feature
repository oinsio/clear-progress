Feature: Ideas CRUD
  Implements FR1, FR2, FR3, FR8 of add-ideas-specs.

  @add-ideas-specs @FR1 @FR8
  Scenario: Create idea with name only
    When user creates idea "Learn Rust"
    Then idea is persisted with name "Learn Rust"
    And idea has description ""
    And idea has revision 0
    And idea has syncStatus "pending"
    And idea has is_deleted false

  @add-ideas-specs @FR1 @FR8
  Scenario: Create idea with name and description
    When user creates idea "Learn Rust" with description "Systems programming"
    Then idea is persisted with name "Learn Rust"
    And idea has description "Systems programming"

  @fractional-sort-order @FR8
  Scenario: New idea appended to end of list
    Given 3 active ideas exist
    When user creates idea "New Idea"
    Then idea has sort_order above existing maximum

  @add-ideas-specs @FR1 @FR8
  Scenario: UUID generated client-side
    When user creates idea "Learn Rust"
    Then idea id is valid UUID v4

  @add-ideas-specs @FR1 @FR8
  Scenario: Timestamps set on creation
    When user creates idea "Learn Rust"
    Then idea created_at and updated_at are equal
    And idea timestamps are ISO 8601 with Z suffix

  @add-ideas-specs @FR2
  Scenario: List sorted by sort_order
    Given ideas with sort_order 2, 0, 1
    When user requests all ideas
    Then ideas are returned in order 2, 1, 0

  @add-ideas-specs @FR2
  Scenario: Empty list
    Given no ideas exist
    When user requests all ideas
    Then empty array is returned

  @add-ideas-specs @FR2
  Scenario: Soft-deleted ideas excluded
    Given 2 active and 1 deleted ideas
    When user requests all ideas
    Then only 2 ideas are returned

  @add-ideas-specs @FR3
  Scenario: Update idea name
    Given idea "Learn Rust" exists
    When user updates idea name to "Learn Go"
    Then idea name is "Learn Go"
    And idea has syncStatus "pending"
    And idea updated_at is refreshed

  @add-ideas-specs @FR3
  Scenario: Update idea description
    Given idea with description "Old" exists
    When user updates idea description to "New"
    Then idea description is "New"
    And idea has syncStatus "pending"

  @add-ideas-specs @FR3
  Scenario: Update nonexistent idea throws error
    When user updates nonexistent idea
    Then error "Idea not found" is thrown
