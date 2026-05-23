Feature: Cascade Checklist Delete — Self-Healing Before Push
  Implements FR3 of cascade-checklist-delete.
  Before push, orphaned checklist items are detected and removed.

  @cascade-checklist-delete @FR3
  Scenario: Orphaned checklist item is removed before push
    Given a checklist item "C1" referencing task "T99" that does not exist in IndexedDB
    When push is triggered
    Then checklist item "C1" is hard-deleted from IndexedDB
    And checklist item "C1" is not included in push data
    And a warning is logged about orphaned item "C1"

  @cascade-checklist-delete @FR3
  Scenario: Checklist item with existing task is not affected
    Given a checklist item "C1" referencing task "T1" that exists in IndexedDB
    When push is triggered
    Then checklist item "C1" is included in push data normally

  @cascade-checklist-delete @FR3
  Scenario: Self-healing with incremental push
    Given a checklist item "C1" with needsSync true referencing task "T1"
    And task "T1" exists in IndexedDB but has needsSync false
    When incremental push is triggered
    Then checklist item "C1" is included in push data normally

  @cascade-checklist-delete @FR3
  Scenario: Self-healing with no orphans
    Given all checklist items reference existing tasks
    When push is triggered
    Then no items are removed and no warnings are logged
