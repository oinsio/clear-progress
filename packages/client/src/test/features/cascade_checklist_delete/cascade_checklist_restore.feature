Feature: Cascade Checklist Delete — Restore
  Implements FR2 of cascade-checklist-delete.
  On restore, all checklist items are restored.

  @cascade-checklist-delete @FR2
  Scenario: Restore task restores all checklist items
    Given a deleted task "T1" with deleted checklist items "C1" and "C2"
    When user restores task "T1"
    Then task "T1" has is_deleted false and needsSync true
    And checklist item "C1" has is_deleted false and needsSync true
    And checklist item "C2" has is_deleted false and needsSync true

  @cascade-checklist-delete @FR2
  Scenario: Restore task with no checklist items
    Given a deleted task "T1" with no checklist items
    When user restores task "T1"
    Then task "T1" has is_deleted false
    And no error occurs

  @cascade-checklist-delete @FR2
  Scenario: Restore task restores previously manually deleted checklist items
    Given a task "T1" where "C1" was manually deleted before task deletion
    And task "T1" and all its checklist items are now deleted
    When user restores task "T1"
    Then checklist item "C1" has is_deleted false
    And all checklist items are restored regardless of deletion origin
