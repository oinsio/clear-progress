Feature: Deleted entities aggregation
  Implements FR1, FR3, FR5 of deleted-entities-spec.

  @deleted-entities-spec @FR1
  Scenario: All deleted entities are returned grouped by type
    Given deleted entities exist across all types
    When the deleted entities are queried
    Then tasks array contains only deleted tasks
    And goals array contains only deleted goals
    And contexts array contains only deleted contexts
    And categories array contains only deleted categories
    And checklist items array contains only deleted checklist items

  @deleted-entities-spec @FR1
  Scenario: Only deleted entities are included
    Given a mix of active and deleted tasks exists
    When the deleted entities are queried
    Then tasks array contains only entities with is_deleted true

  @deleted-entities-spec @FR1
  Scenario: Active entities are excluded from all types
    Given only active entities exist across all types
    When the deleted entities are queried
    Then all entity type arrays are empty

  @deleted-entities-spec @FR3
  Scenario: Empty state with no deleted entities
    Given no deleted entities exist in the database
    When the deleted entities are queried
    Then all entity type arrays are empty

  @deleted-entities-spec @FR3
  Scenario: Non-empty state with at least one deleted entity
    Given one deleted task exists
    When the deleted entities are queried
    Then tasks array is not empty

  @swipeable-item @FR19
  Scenario: Deleted ideas are included in aggregation
    Given a deleted idea "Research topic" exists
    When deleted entities are loaded
    Then the ideas array contains "Research topic"

  @swipeable-item @FR19
  Scenario: Non-empty state with at least one deleted idea
    Given a deleted idea "Research topic" exists
    And no other entities are deleted
    When deleted entities are loaded
    Then isEmpty is false

  @deleted-entities-spec @FR5
  Scenario: Newly deleted entity appears after query
    Given no deleted tasks exist
    When a task is soft-deleted after initial query
    Then the deleted tasks array includes the newly deleted task
