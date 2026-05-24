Feature: Checklists CRUD — Read
  Implements FR1 of add-checklist-specs.

  @add-checklist-specs @FR1
  Scenario: Get items by task sorted by sort_order
    Given a task exists
    And checklist items with sort_order 2, 0, 1 for the task
    When user requests checklist items for the task
    Then checklist items are returned in order 0, 1, 2

  @add-checklist-specs @FR1
  Scenario: Soft-deleted items excluded
    Given a task exists
    And 2 active and 1 deleted checklist items for the task
    When user requests checklist items for the task
    Then only 2 checklist items are returned

  @add-checklist-specs @FR1
  Scenario: Empty checklist
    Given a task exists
    And no checklist items exist for the task
    When user requests checklist items for the task
    Then empty array is returned

  @add-checklist-specs @FR1
  Scenario: Read existing item by ID
    Given a task exists
    And checklist item "Buy milk" exists for the task
    When user requests checklist item by ID "Buy milk"
    Then checklist item with name "Buy milk" is returned

  @add-checklist-specs @FR1
  Scenario: Read nonexistent item returns undefined
    When user requests checklist item by nonexistent ID
    Then undefined is returned
