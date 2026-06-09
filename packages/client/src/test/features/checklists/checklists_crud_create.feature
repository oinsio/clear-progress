Feature: Checklists CRUD — Create
  Implements FR1 of add-checklist-specs.

  @add-checklist-specs @FR1
  Scenario: Create checklist item with defaults
    Given a task exists
    When user creates checklist item "Buy milk" for the task
    Then checklist item is persisted with name "Buy milk"
    And checklist item has is_completed false
    And checklist item has revision 0
    And checklist item has needsSync true
    And checklist item has is_deleted false

  @add-checklist-specs @FR1
  Scenario: Sort order defaults to end of list
    Given a task exists
    And 3 active checklist items exist for the task
    When user creates checklist item "New Item" for the task
    Then checklist item has sort_order above existing maximum

  @add-checklist-specs @FR1
  Scenario: UUID generated client-side
    Given a task exists
    When user creates checklist item "Buy milk" for the task
    Then checklist item id is valid UUID v4

  @add-checklist-specs @FR1
  Scenario: Timestamps set on creation
    Given a task exists
    When user creates checklist item "Buy milk" for the task
    Then checklist item created_at and updated_at are equal
    And checklist item timestamps are ISO 8601 with Z suffix
