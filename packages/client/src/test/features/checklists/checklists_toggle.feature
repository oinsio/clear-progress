Feature: Checklists — Toggle completion
  Implements FR2 of add-checklist-specs.

  @add-checklist-specs @FR2
  Scenario: Toggle incomplete item to completed
    Given an incomplete checklist item "Buy milk" exists
    When user toggles checklist item "Buy milk"
    Then checklist item "Buy milk" has is_completed true
    And checklist item "Buy milk" has syncStatus "pending"
    And checklist item "Buy milk" updated_at is refreshed

  @add-checklist-specs @FR2
  Scenario: Toggle completed item to incomplete
    Given a completed checklist item "Buy milk" exists
    When user toggles checklist item "Buy milk"
    Then checklist item "Buy milk" has is_completed false
    And checklist item "Buy milk" has syncStatus "pending"
    And checklist item "Buy milk" updated_at is refreshed

  @add-checklist-specs @FR2
  Scenario: Toggle nonexistent item throws error
    When user toggles a nonexistent checklist item
    Then error "ChecklistItem not found" is thrown
