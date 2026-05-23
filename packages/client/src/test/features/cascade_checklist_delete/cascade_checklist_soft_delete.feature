Feature: Cascade Checklist Delete — Soft Delete
  Implements FR1 of cascade-checklist-delete.
  On soft-delete, checklist items are cascaded.

  @cascade-checklist-delete @FR1
  Scenario: Soft-delete task cascades to its checklist items
    Given a task "T1" with checklist items "C1" and "C2"
    When user soft-deletes task "T1"
    Then task "T1" has is_deleted true and needsSync true
    And checklist item "C1" has is_deleted true and needsSync true
    And checklist item "C2" has is_deleted true and needsSync true

  @cascade-checklist-delete @FR1
  Scenario: Soft-delete task with no checklist items
    Given a task "T1" with no checklist items
    When user soft-deletes task "T1"
    Then task "T1" has is_deleted true
    And no error occurs

  @cascade-checklist-delete @FR1
  Scenario: Soft-delete task with already-deleted checklist items
    Given a task "T1" with checklist item "C1" active and "C2" already deleted
    When user soft-deletes task "T1"
    Then checklist item "C1" has is_deleted true and needsSync true
    And checklist item "C2" has is_deleted true and needsSync true with updated updated_at
