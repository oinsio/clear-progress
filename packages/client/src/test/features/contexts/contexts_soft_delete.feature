Feature: Contexts Soft Delete
  Implements FR4, FR5 of add-context-category-specs.

  @add-context-category-specs @FR4
  Scenario: Soft-delete a context
    Given active context "@home" exists
    When user soft-deletes context "@home"
    Then context "@home" has is_deleted true
    And context "@home" has syncStatus "pending"

  @add-context-category-specs @FR5
  Scenario: Restore a soft-deleted context
    Given soft-deleted context "@home" exists
    When user restores context "@home"
    Then context "@home" has is_deleted false
    And context "@home" has syncStatus "pending"

  @add-context-category-specs @FR4 @FR2
  Scenario: Soft-deleted context excluded from active list
    Given active context "@home" is soft-deleted
    When user views context list
    Then "@home" does not appear in the list
