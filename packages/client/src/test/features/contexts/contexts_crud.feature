Feature: Contexts CRUD
  Implements FR1, FR2, FR3 of add-context-category-specs.

  @add-context-category-specs @FR1
  Scenario: Create context with name
    When user creates context "@home"
    Then context is persisted with name "@home"
    And context has revision 0
    And context has needsSync true
    And context has is_deleted false

  @add-context-category-specs @FR1
  Scenario: Sort order defaults to end of list
    Given 3 active contexts exist
    When user creates context "@new"
    Then context has sort_order 3

  @add-context-category-specs @FR1
  Scenario: UUID generated client-side
    When user creates context "@home"
    Then context id is valid UUID v4

  @add-context-category-specs @FR1
  Scenario: Timestamps set on creation
    When user creates context "@home"
    Then context created_at and updated_at are equal
    And context timestamps are ISO 8601 with Z suffix

  @add-context-category-specs @FR2
  Scenario: List sorted by sort_order
    Given contexts with sort_order 2, 0, 1
    When user requests all contexts
    Then contexts are returned in order 0, 1, 2

  @add-context-category-specs @FR2
  Scenario: Empty list
    Given no contexts exist
    When user requests all contexts
    Then empty array is returned

  @add-context-category-specs @FR2
  Scenario: Soft-deleted contexts excluded
    Given 2 active and 1 deleted contexts
    When user requests all contexts
    Then only 2 contexts are returned

  @add-context-category-specs @FR3
  Scenario: Update context name
    Given context "@home" exists
    When user updates context name to "@office"
    Then context name is "@office"
    And context has needsSync true
    And context updated_at is refreshed

  @add-context-category-specs @FR3
  Scenario: Update nonexistent context throws error
    When user updates nonexistent context
    Then error "Context not found" is thrown
