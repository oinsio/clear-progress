Feature: Goals CRUD
  Implements FR1, FR2, FR3 of add-goals-specs.

  @add-goals-specs @FR1
  Scenario: Create goal with name only
    When user creates goal "Learn Rust"
    Then goal is persisted with name "Learn Rust"
    And goal has description ""
    And goal has cover_hash ""
    And goal has status "planning"
    And goal has revision 0
    And goal has syncStatus "pending"
    And goal has is_deleted false

  @add-goals-specs @FR1
  Scenario: Create goal with name and description
    When user creates goal "Learn Rust" with description "Systems programming"
    Then goal is persisted with name "Learn Rust"
    And goal has description "Systems programming"

  @add-goals-specs @FR1
  Scenario: Create goal with explicit status
    When user creates goal "Active project" with status "in_progress"
    Then goal has status "in_progress"

  @add-goals-specs @FR1
  Scenario: Sort order defaults to end of list
    Given 3 active goals exist
    When user creates goal "New Goal"
    Then goal has sort_order above existing maximum

  @add-goals-specs @FR1
  Scenario: UUID generated client-side
    When user creates goal "Learn Rust"
    Then goal id is valid UUID v4

  @add-goals-specs @FR1
  Scenario: Timestamps set on creation
    When user creates goal "Learn Rust"
    Then goal created_at and updated_at are equal
    And goal timestamps are ISO 8601 with Z suffix

  @add-goals-specs @FR2
  Scenario: List sorted by sort_order
    Given goals with sort_order 2, 0, 1
    When user requests all goals
    Then goals are returned in order 2, 1, 0

  @add-goals-specs @FR2
  Scenario: Empty list
    Given no goals exist
    When user requests all goals
    Then empty array is returned

  @add-goals-specs @FR2
  Scenario: Soft-deleted goals excluded
    Given 2 active and 1 deleted goals
    When user requests all goals
    Then only 2 goals are returned

  @add-goals-specs @FR3
  Scenario: Update goal name
    Given goal "Learn Rust" exists
    When user updates goal name to "Learn Go"
    Then goal name is "Learn Go"
    And goal has syncStatus "pending"
    And goal updated_at is refreshed

  @add-goals-specs @FR3
  Scenario: Update goal description
    Given goal with description "Old" exists
    When user updates goal description to "New"
    Then goal description is "New"
    And goal has syncStatus "pending"

  @add-goals-specs @FR3
  Scenario: Update nonexistent goal throws error
    When user updates nonexistent goal
    Then error "Goal not found" is thrown
