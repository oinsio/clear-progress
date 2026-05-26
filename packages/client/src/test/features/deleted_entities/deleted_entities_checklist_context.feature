Feature: Deleted entities checklist parent context
  Implements FR6 of deleted-entities-spec.

  @deleted-entities-spec @FR6
  Scenario: Checklist item has parent task name available
    Given a task "Morning routine" with a deleted checklist item "Brush teeth" exists
    When the task name map is queried
    Then the map contains the task id mapped to "Morning routine"

  @deleted-entities-spec @FR6
  Scenario: Task name map includes deleted parent tasks
    Given a deleted task "Old routine" with a deleted checklist item "Wake up" exists
    When the task name map is queried
    Then the map contains the deleted task id mapped to "Old routine"

  @deleted-entities-spec @FR6
  Scenario: Task name map is empty when no tasks exist
    Given no tasks exist in the database
    When the task name map is queried
    Then the map is empty
