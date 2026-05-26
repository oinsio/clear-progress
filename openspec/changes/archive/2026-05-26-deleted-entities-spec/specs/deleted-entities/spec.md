## ADDED Requirements

### Requirement: Aggregate soft-deleted entities across all types

The system SHALL provide a unified view of all soft-deleted entities from 5 entity types: tasks, goals, contexts, categories, and checklist items. Each type is queried independently by filtering records where `is_deleted = true`.

#### Scenario: All deleted entities are returned grouped by type  # implements FR1 of deleted-entities-spec
- **WHEN** there are deleted tasks, goals, contexts, categories, and checklist items in the database
- **THEN** the aggregation returns all deleted entities grouped by their respective type

#### Scenario: Only deleted entities are included  # implements FR1 of deleted-entities-spec
- **WHEN** a mix of active and deleted entities exists across all types
- **THEN** only entities with `is_deleted = true` are included in the results

#### Scenario: Active entities are excluded  # implements FR1 of deleted-entities-spec
- **WHEN** all entities have `is_deleted = false`
- **THEN** the aggregation returns empty arrays for all entity types

### Requirement: Empty state when no deleted entities exist

The system SHALL indicate an empty state when all entity type arrays are empty (zero deleted tasks, zero deleted goals, zero deleted contexts, zero deleted categories, zero deleted checklist items).

#### Scenario: Empty state with no deleted entities  # implements FR3 of deleted-entities-spec
- **WHEN** no entities have `is_deleted = true`
- **THEN** the system reports an empty state

#### Scenario: Non-empty state with at least one deleted entity  # implements FR3 of deleted-entities-spec
- **WHEN** at least one entity of any type has `is_deleted = true`
- **THEN** the system does not report an empty state

### Requirement: Loading state during initialization

The system SHALL indicate a loading state while entity subscriptions are initializing. Loading completes when all subscriptions have emitted their first value.

#### Scenario: Loading state before subscriptions complete  # implements FR4 of deleted-entities-spec
- **WHEN** the aggregation is first initialized
- **THEN** isLoading is true until all entity type subscriptions have emitted

### Requirement: Reactive updates on entity changes

The system SHALL reactively update the deleted entities view when entities are deleted or restored in other parts of the application. This is achieved through Dexie liveQuery subscriptions.

#### Scenario: New deletion appears in real-time  # implements FR5 of deleted-entities-spec
- **WHEN** an entity is soft-deleted while the deleted entities view is active
- **THEN** the entity appears in the corresponding type array without manual refresh

#### Scenario: Restored entity disappears in real-time  # implements FR5 of deleted-entities-spec
- **WHEN** a deleted entity is restored while the deleted entities view is active
- **THEN** the entity is removed from the corresponding type array without manual refresh

### Requirement: Checklist items show parent task name

For deleted checklist items, the system SHALL provide a mapping from `task_id` to parent task name. This mapping includes all tasks (both active and deleted) so that parent context is always available.

#### Scenario: Checklist item displays parent task name  # implements FR6 of deleted-entities-spec
- **WHEN** a deleted checklist item has a `task_id` referencing an existing task
- **THEN** the task name map contains the mapping from that `task_id` to the task name

#### Scenario: Task name map includes deleted parent tasks  # implements FR6 of deleted-entities-spec
- **WHEN** a deleted checklist item references a task that is also deleted
- **THEN** the task name map still contains the parent task name

### Requirement: Restore entity per type

The system SHALL provide restore operations for each entity type. Restore sets `is_deleted = false` on the entity, increments version metadata, and schedules a sync push.

#### Scenario: Restore a deleted task  # implements FR2 of deleted-entities-spec
- **WHEN** a deleted task is restored
- **THEN** the task has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted task cascades to checklist items  # implements FR2 of deleted-entities-spec
- **WHEN** a deleted task with checklist items is restored
- **THEN** the task and all its checklist items have `is_deleted = false`

#### Scenario: Restore a deleted goal  # implements FR2 of deleted-entities-spec
- **WHEN** a deleted goal is restored
- **THEN** the goal has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted context  # implements FR2 of deleted-entities-spec
- **WHEN** a deleted context is restored
- **THEN** the context has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted category  # implements FR2 of deleted-entities-spec
- **WHEN** a deleted category is restored
- **THEN** the category has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted checklist item  # implements FR2 of deleted-entities-spec
- **WHEN** a deleted checklist item is restored
- **THEN** the checklist item has `is_deleted = false` and `needsSync = true`
