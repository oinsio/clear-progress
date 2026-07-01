# Deleted Entities — Delta Spec

Changes to the deleted-entities capability for swipeable-item.

## MODIFIED Requirements

### Requirement: Aggregate soft-deleted entities across all types

The system SHALL provide a unified view of all soft-deleted entities from 6 entity types: tasks, goals, ideas, contexts, categories, and checklist items. Each type is queried independently by filtering records where `is_deleted = true`. Implements FR19 of swipeable-item.

#### Scenario: All deleted entities are returned grouped by type

- **WHEN** there are deleted tasks, goals, ideas, contexts, categories, and checklist items in the database
- **THEN** the aggregation returns all deleted entities grouped by their respective type

#### Scenario: Only deleted entities are included

- **WHEN** a mix of active and deleted entities exists across all types
- **THEN** only entities with `is_deleted = true` are included in the results

#### Scenario: Active entities are excluded

- **WHEN** all entities have `is_deleted = false`
- **THEN** the aggregation returns empty arrays for all entity types

#### Scenario: Deleted ideas are included

- **WHEN** there are soft-deleted ideas in the database
- **THEN** the ideas array contains those deleted ideas

### Requirement: Empty state when no deleted entities exist

The system SHALL indicate an empty state when all entity type arrays are empty (zero deleted tasks, zero deleted goals, zero deleted ideas, zero deleted contexts, zero deleted categories, zero deleted checklist items). Implements FR19 of swipeable-item.

#### Scenario: Empty state with no deleted entities

- **WHEN** no entities have `is_deleted = true`
- **THEN** the system reports an empty state

#### Scenario: Non-empty state with at least one deleted idea

- **WHEN** at least one idea has `is_deleted = true` and all other types have zero deleted
- **THEN** the system does not report an empty state

### Requirement: Restore entity per type

The system SHALL provide restore operations for each entity type including ideas. Restore sets `is_deleted = false` on the entity, increments version metadata, and schedules a sync push. Implements FR20 of swipeable-item.

#### Scenario: Restore a deleted task

- **WHEN** a deleted task is restored
- **THEN** the task has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted task cascades to checklist items

- **WHEN** a deleted task with checklist items is restored
- **THEN** the task and all its checklist items have `is_deleted = false`

#### Scenario: Restore a deleted goal

- **WHEN** a deleted goal is restored
- **THEN** the goal has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted idea

- **WHEN** a deleted idea is restored
- **THEN** the idea has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted context

- **WHEN** a deleted context is restored
- **THEN** the context has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted category

- **WHEN** a deleted category is restored
- **THEN** the category has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted checklist item

- **WHEN** a deleted checklist item is restored
- **THEN** the checklist item has `is_deleted = false` and `needsSync = true`

## ADDED Requirements

### Requirement: DeletedPage displays ideas section

DeletedPage SHALL display a collapsible section for deleted ideas alongside other entity types. Each idea SHALL show its name with line-through styling and a restore button. Implements FR21 of swipeable-item.

#### Scenario: Ideas section visible on DeletedPage

- **WHEN** there are deleted ideas
- **THEN** DeletedPage shows an Ideas section with the deleted ideas listed

#### Scenario: Ideas section empty state

- **WHEN** there are no deleted ideas
- **THEN** the Ideas section shows "No deleted items" message

### Requirement: DeletedPage swipe restore

DeletedPage SHALL wrap each deleted entity item in SwipeableItem with swipeRight configured for restore action (blue background, ArchiveRestore icon). Implements FR18 of swipeable-item.

#### Scenario: Swipe right restores deleted task

- **WHEN** user swipes right on a deleted task on DeletedPage
- **THEN** the task is restored (is_deleted=false, needsSync=true)

#### Scenario: Swipe right restores deleted idea

- **WHEN** user swipes right on a deleted idea on DeletedPage
- **THEN** the idea is restored (is_deleted=false, needsSync=true)

#### Scenario: Restore button remains as alternative

- **WHEN** DeletedPage renders a deleted entity
- **THEN** both swipe-right and restore button are available as restore mechanisms
