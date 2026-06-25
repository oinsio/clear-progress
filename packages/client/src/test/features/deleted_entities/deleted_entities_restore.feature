Feature: Deleted entities restore
  Implements FR2, FR8 of deleted-entities-spec.

  @deleted-entities-spec @FR2 @FR8
  Scenario: Restore a deleted task
    Given a deleted task "Buy groceries" exists
    When the task is restored
    Then the task has is_deleted false and needsSync true

  @deleted-entities-spec @FR2 @FR8
  Scenario: Restore a deleted task cascades to checklist items
    Given a deleted task "Morning routine" with deleted checklist items exists
    When the task is restored
    Then the task has is_deleted false
    And all checklist items of that task have is_deleted false

  @deleted-entities-spec @FR2 @FR8
  Scenario: Restore a deleted goal
    Given a deleted goal "Learn TypeScript" exists
    When the goal is restored
    Then the goal has is_deleted false and needsSync true

  @deleted-entities-spec @FR2 @FR8
  Scenario: Restore a deleted context
    Given a deleted context "@home" exists
    When the context is restored
    Then the context has is_deleted false and needsSync true

  @deleted-entities-spec @FR2 @FR8
  Scenario: Restore a deleted category
    Given a deleted category "Work" exists
    When the category is restored
    Then the category has is_deleted false and needsSync true

  @swipeable-item @FR20
  Scenario: Restore a deleted idea
    Given a deleted idea "Research topic" exists
    When the idea is restored
    Then the idea has is_deleted false and needsSync true

  @deleted-entities-spec @FR2 @FR8
  Scenario: Restore a deleted checklist item
    Given a deleted checklist item "Step 1" exists
    When the checklist item is restored
    Then the checklist item has is_deleted false and needsSync true
