Feature: Checklists — Reorder
  Implements FR5 of add-checklist-specs.

  @add-checklist-specs @FR5
  Scenario: Reorder places item at new position via fractional key
    Given checklist items "A", "B", "C" exist with ascending sort_order
    When user moves item "C" before item "A"
    Then items are ordered "C", "A", "B"

  @add-checklist-specs @FR5
  Scenario: Reorder marks moved item for sync
    Given checklist items "A", "B", "C" exist with ascending sort_order
    When user moves item "C" before item "A"
    Then item "C" has syncStatus "pending"
    And item "A" has syncStatus "synced"
    And item "B" has syncStatus "synced"

  @add-checklist-specs @FR5
  Scenario: Reorder throws for non-existent item
    When user reorders non-existent item
    Then an error is thrown
