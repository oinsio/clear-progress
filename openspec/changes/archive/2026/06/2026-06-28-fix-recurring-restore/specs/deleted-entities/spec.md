## MODIFIED Requirements

### Requirement: Restore entity per type

The system SHALL provide restore operations for each entity type including ideas. Restore sets `is_deleted = false` on the entity, increments version metadata, and schedules a sync push. Implements FR20 of swipeable-item.

For tasks with non-empty `repeat_rule` and non-empty `original_task_id` (indicating a promotion occurred during soft-delete), restore SHALL check whether the promoted successor is alive. If alive, restore SHALL clear `repeat_rule`, `next_date`, and `appear_date` to prevent duplicate recurring chains. If the promoted successor is deleted or does not exist, restore SHALL clear `original_task_id` and keep `repeat_rule` intact, restoring the task as a chain original.

#### Scenario: Restore a deleted task
- **WHEN** a deleted task is restored
- **THEN** the task has `is_deleted = false` and `needsSync = true`

#### Scenario: Restore a deleted task cascades to checklist items
- **WHEN** a deleted task with checklist items is restored
- **THEN** the task and all its checklist items have `is_deleted = false`

#### Scenario: Restore a deleted recurring task with active promoted successor
- **WHEN** a deleted recurring task with a promoted successor (original_task_id set during softDelete) is restored
- **AND** the promoted successor is active (not deleted)
- **THEN** the task has `is_deleted = false`, `repeat_rule = ""`, `next_date = ""`, `appear_date = ""`

#### Scenario: Restore a deleted recurring task with deleted promoted successor
- **WHEN** a deleted recurring task with a promoted successor is restored
- **AND** the promoted successor is also deleted
- **THEN** the task has `is_deleted = false`, `original_task_id = ""`, and `repeat_rule` preserved

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
