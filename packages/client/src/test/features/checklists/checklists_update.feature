Feature: Checklists — Update
  Implements FR3 of add-checklist-specs.

  @add-checklist-specs @FR3
  Scenario: Update item name
    Given a checklist item "Buy milk" exists
    When user updates checklist item "Buy milk" name to "Buy oat milk"
    Then checklist item "Buy milk" has name "Buy oat milk"
    And checklist item "Buy milk" has syncStatus "pending"
    And checklist item "Buy milk" updated_at is refreshed

  @add-checklist-specs @FR3
  Scenario: No-op update does not trigger sync
    Given a checklist item "Buy milk" exists with syncStatus "synced"
    When user updates checklist item "Buy milk" name to "Buy milk"
    Then checklist item "Buy milk" has syncStatus "synced"
    And checklist item "Buy milk" updated_at is unchanged

  @add-checklist-specs @FR3
  Scenario: Update nonexistent item throws error
    When user updates a nonexistent checklist item
    Then error "ChecklistItem not found" is thrown
