Feature: Checklists — Delete and restore
  Implements FR4 of add-checklist-specs.

  @add-checklist-specs @FR4
  Scenario: Soft-delete a checklist item
    Given an active checklist item "Buy milk" exists
    When user soft-deletes checklist item "Buy milk"
    Then checklist item "Buy milk" has is_deleted true
    And checklist item "Buy milk" has syncStatus "pending"

  @add-checklist-specs @FR4
  Scenario: Restore a soft-deleted checklist item
    Given a soft-deleted checklist item "Buy milk" exists
    When user restores checklist item "Buy milk"
    Then checklist item "Buy milk" has is_deleted false
    And checklist item "Buy milk" has syncStatus "pending"
