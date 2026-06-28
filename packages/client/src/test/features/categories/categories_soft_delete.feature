Feature: Categories Soft Delete
  Implements FR4, FR5 of add-context-category-specs.

  @add-context-category-specs @FR4
  Scenario: Soft-delete a category
    Given active category "Work" exists
    When user soft-deletes category "Work"
    Then category "Work" has is_deleted true
    And category "Work" has syncStatus "pending"

  @add-context-category-specs @FR5
  Scenario: Restore a soft-deleted category
    Given soft-deleted category "Work" exists
    When user restores category "Work"
    Then category "Work" has is_deleted false
    And category "Work" has syncStatus "pending"

  @add-context-category-specs @FR4 @FR2
  Scenario: Soft-deleted category excluded from active list
    Given active category "Work" is soft-deleted
    When user views category list
    Then "Work" does not appear in the list
