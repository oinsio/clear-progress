Feature: Categories CRUD
  Implements FR1, FR2, FR3 of add-context-category-specs.

  @add-context-category-specs @FR1
  Scenario: Create category with name
    When user creates category "Work"
    Then category is persisted with name "Work"
    And category has revision 0
    And category has needsSync true
    And category has is_deleted false

  @add-context-category-specs @FR1
  Scenario: Sort order defaults to end of list
    Given 3 active categories exist
    When user creates category "New Category"
    Then category has sort_order 3

  @add-context-category-specs @FR1
  Scenario: UUID generated client-side
    When user creates category "Work"
    Then category id is valid UUID v4

  @add-context-category-specs @FR1
  Scenario: Timestamps set on creation
    When user creates category "Work"
    Then category created_at and updated_at are equal
    And category timestamps are ISO 8601 with Z suffix

  @add-context-category-specs @FR2
  Scenario: List sorted by sort_order
    Given categories with sort_order 2, 0, 1
    When user requests all categories
    Then categories are returned in order 0, 1, 2

  @add-context-category-specs @FR2
  Scenario: Empty list
    Given no categories exist
    When user requests all categories
    Then empty array is returned

  @add-context-category-specs @FR2
  Scenario: Soft-deleted categories excluded
    Given 2 active and 1 deleted categories
    When user requests all categories
    Then only 2 categories are returned

  @add-context-category-specs @FR3
  Scenario: Update category name
    Given category "Work" exists
    When user updates category name to "Personal"
    Then category name is "Personal"
    And category has needsSync true
    And category updated_at is refreshed

  @add-context-category-specs @FR3
  Scenario: Update nonexistent category throws error
    When user updates nonexistent category
    Then error "Category not found" is thrown
