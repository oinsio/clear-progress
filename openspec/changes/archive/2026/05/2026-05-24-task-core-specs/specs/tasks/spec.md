# Capability: Tasks

## Purpose

Core task management. Tasks live in boxes (inbox, today, week, later), support completion, reordering, search, duplication, and associations with Goals, Contexts, and Categories. Soft delete with cascade to checklist items.

## ADDED Requirements

### Requirement: User can create a task
# implements FR1 of task-core-specs

User SHALL be able to create a task by providing a name and box. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false, `is_completed` to false, `completed_at` to empty string, `is_hidden` to false. Optional fields (`description`, `goal_id`, `context_id`, `category_id`, `repeat_rule`, `next_date`, `appear_date`, `original_task_id`) MUST default to empty string. The `sort_order` MUST default to the count of existing tasks in the same box. Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix.

#### Scenario: Create task with name and box
- **GIVEN** inbox has 0 tasks
- **WHEN** user creates a task with name "Buy groceries" in box "inbox"
- **THEN** task is persisted with name "Buy groceries", box "inbox", revision 0, needsSync true, is_deleted false, is_completed false

#### Scenario: Sort order defaults to end of box
- **GIVEN** inbox has 3 tasks
- **WHEN** user creates a new task in inbox
- **THEN** new task has sort_order = 3

#### Scenario: UUID generated client-side
- **WHEN** user creates a task
- **THEN** task.id is a valid UUID v4

#### Scenario: Timestamps set on creation
- **WHEN** user creates a task
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

#### Scenario: Optional fields default to empty string
- **WHEN** user creates a task with only name and box
- **THEN** description, goal_id, context_id, category_id, repeat_rule, next_date, appear_date, original_task_id are all empty strings

### Requirement: User can read a task by ID
# implements FR1 of task-core-specs

User SHALL be able to retrieve a task by its ID. System MUST return the task if it exists, or undefined if not found.

#### Scenario: Read existing task
- **GIVEN** task "Buy groceries" exists with a known ID
- **WHEN** user reads task by that ID
- **THEN** system returns the task with all fields

#### Scenario: Read nonexistent task
- **WHEN** user reads task by a nonexistent ID
- **THEN** system returns undefined

### Requirement: User can update a task
# implements FR1 of task-core-specs

User SHALL be able to update task fields. System MUST use smart dirty flag: if the update contains identical data to the current state, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed. The `id` field MUST never change.

#### Scenario: Update task name
- **GIVEN** task "Buy groceries" exists
- **WHEN** user updates name to "Buy vegetables"
- **THEN** task name is "Buy vegetables", needsSync is true, updated_at is refreshed

#### Scenario: No-op update does not trigger sync
- **GIVEN** task "Buy groceries" exists with needsSync false
- **WHEN** user updates name to "Buy groceries" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent task throws error
- **WHEN** user attempts to update a task with a nonexistent ID
- **THEN** system throws error "Task not found"

### Requirement: User can get tasks by box
# implements FR2 of task-core-specs

User SHALL be able to retrieve all non-deleted tasks for a given box, sorted by `sort_order` ascending. Soft-deleted tasks MUST NOT appear. Hidden tasks are included (box-level query does not filter by is_hidden).

#### Scenario: Get tasks by box sorted by sort_order
- **GIVEN** inbox has tasks with sort_order 2, 0, 1
- **WHEN** user gets tasks by box "inbox"
- **THEN** tasks are returned in order: sort_order 0, 1, 2

#### Scenario: Empty box
- **GIVEN** inbox has no tasks
- **WHEN** user gets tasks by box "inbox"
- **THEN** an empty array is returned

#### Scenario: Soft-deleted tasks excluded from box
- **GIVEN** inbox has 2 active tasks and 1 soft-deleted task
- **WHEN** user gets tasks by box "inbox"
- **THEN** only 2 active tasks are returned

### Requirement: User can move a task between boxes
# implements FR2 of task-core-specs

User SHALL be able to move a task from one box to another by updating its `box` field.

#### Scenario: Move task from inbox to today
- **GIVEN** task "Buy groceries" is in box "inbox"
- **WHEN** user moves task to box "today"
- **THEN** task.box is "today", needsSync is true

#### Scenario: Move task to same box is no-op
- **GIVEN** task "Buy groceries" is in box "inbox"
- **WHEN** user moves task to box "inbox"
- **THEN** needsSync remains false, updated_at is unchanged

### Requirement: User can complete a task
# implements FR3 of task-core-specs

User SHALL be able to mark a task as completed. System MUST set `is_completed` to true and `completed_at` to current timestamp. If the task has a repeat_rule, recurring clone creation is handled separately (out of scope for this spec).

#### Scenario: Complete a task
- **GIVEN** active task "Buy groceries" exists
- **WHEN** user completes the task
- **THEN** is_completed is true, completed_at is set to current timestamp

#### Scenario: Complete nonexistent task throws error
- **WHEN** user attempts to complete a task with a nonexistent ID
- **THEN** system throws error "Task not found"

### Requirement: User can uncomplete a task
# implements FR3 of task-core-specs

User SHALL be able to undo task completion. System MUST set `is_completed` to false and `completed_at` to empty string.

#### Scenario: Uncomplete a task
- **GIVEN** completed task "Buy groceries" exists
- **WHEN** user uncompletes the task
- **THEN** is_completed is false, completed_at is empty string, needsSync is true

#### Scenario: Uncomplete nonexistent task throws error
- **WHEN** user attempts to uncomplete a task with a nonexistent ID
- **THEN** system throws error "Task not found"

### Requirement: User can view completed tasks
# implements FR4 of task-core-specs

User SHALL be able to view all completed tasks sorted by `completed_at` descending (most recent first). If `completed_at` is missing, fallback to `sort_order` descending. Soft-deleted and hidden tasks MUST NOT appear.

#### Scenario: Completed tasks sorted by completed_at descending
- **GIVEN** tasks completed at "2026-01-01T10:00:00.000Z" and "2026-01-02T10:00:00.000Z"
- **WHEN** user views completed tasks
- **THEN** task completed at "2026-01-02" appears first

#### Scenario: No completed tasks
- **GIVEN** no completed tasks exist
- **WHEN** user views completed tasks
- **THEN** an empty array is returned

#### Scenario: Soft-deleted completed tasks excluded
- **GIVEN** a completed task that is also soft-deleted
- **WHEN** user views completed tasks
- **THEN** the soft-deleted task does not appear

### Requirement: User can reorder tasks within a box
# implements FR5 of task-core-specs

User SHALL be able to reorder tasks via drag-and-drop. System MUST assign sequential `sort_order` values (0, 1, 2...) based on position. Only tasks whose `sort_order` actually changed MUST be marked for sync. All changed tasks MUST share the same `updated_at` timestamp. Empty array MUST be a no-op. If order is unchanged, no database write occurs.

#### Scenario: Reorder assigns sequential sort_order
- **GIVEN** tasks A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to B, C, A
- **THEN** B has sort_order=0, C has sort_order=1, A has sort_order=2

#### Scenario: Only changed tasks marked for sync
- **GIVEN** tasks A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to A, C, B
- **THEN** A has needsSync=false (unchanged), C has needsSync=true, B has needsSync=true

#### Scenario: Empty reorder is no-op
- **WHEN** user reorders with an empty array
- **THEN** no database write occurs

#### Scenario: Same order is no-op
- **GIVEN** tasks A (sort_order=0), B (sort_order=1)
- **WHEN** user reorders to A, B (same order)
- **THEN** no database write occurs

### Requirement: User can search tasks by name and description
# implements FR6 of task-core-specs

User SHALL be able to search active (non-deleted, non-hidden) tasks by name or description. Search MUST be case-insensitive and match partial strings. Results MUST be sorted: incomplete tasks first, then completed tasks, within each group sorted by `updated_at` descending.

#### Scenario: Search by name
- **GIVEN** tasks "Buy groceries" and "Read book" exist
- **WHEN** user searches for "buy"
- **THEN** "Buy groceries" is returned

#### Scenario: Search by description
- **GIVEN** task with description "weekly shopping list" exists
- **WHEN** user searches for "shopping"
- **THEN** the task is returned

#### Scenario: Search is case-insensitive
- **GIVEN** task "Buy Groceries" exists
- **WHEN** user searches for "buy groceries"
- **THEN** the task is returned

#### Scenario: Incomplete tasks sorted before completed
- **GIVEN** incomplete task "A" and completed task "B" both match query
- **WHEN** user searches
- **THEN** task "A" appears before task "B"

#### Scenario: No matches returns empty array
- **WHEN** user searches for "nonexistent"
- **THEN** an empty array is returned

### Requirement: User can duplicate a task
# implements FR7 of task-core-specs

User SHALL be able to duplicate a task. System MUST create a new task with the same name, box, description, goal_id, context_id, category_id, and repeat_rule. Checklist items MUST be copied with new IDs and is_completed reset to false. The duplicate MUST have a new UUID, fresh timestamps, and needsSync true.

#### Scenario: Duplicate a task
- **GIVEN** task "Buy groceries" in inbox with description "weekly"
- **WHEN** user duplicates the task
- **THEN** a new task exists with name "Buy groceries", box "inbox", description "weekly"
- **AND** new task has a different ID, fresh timestamps, needsSync true

#### Scenario: Duplicate copies checklist items
- **GIVEN** task "Buy groceries" has 2 checklist items
- **WHEN** user duplicates the task
- **THEN** new task has 2 checklist items with new IDs and is_completed false

#### Scenario: Duplicate nonexistent task throws error
- **WHEN** user attempts to duplicate a task with a nonexistent ID
- **THEN** system throws error "Task not found"

### Requirement: User can get tasks by goal
# implements FR8 of task-core-specs

User SHALL be able to retrieve all active, non-hidden tasks associated with a goal, sorted by `sort_order` ascending.

#### Scenario: Get tasks by goal
- **GIVEN** 2 tasks associated with goal "Learn TypeScript" and 1 task with a different goal
- **WHEN** user gets tasks by goal "Learn TypeScript"
- **THEN** only 2 associated tasks are returned, sorted by sort_order

#### Scenario: No tasks for goal
- **WHEN** user gets tasks for a goal with no associated tasks
- **THEN** an empty array is returned

### Requirement: User can get tasks by context
# implements FR8 of task-core-specs

User SHALL be able to retrieve all active, non-hidden, incomplete tasks associated with a context, sorted by `sort_order` ascending.

#### Scenario: Get tasks by context
- **GIVEN** 2 incomplete tasks associated with context "@home"
- **WHEN** user gets tasks by context "@home"
- **THEN** 2 tasks are returned, sorted by sort_order

#### Scenario: Completed tasks excluded from context view
- **GIVEN** 1 incomplete and 1 completed task associated with context "@home"
- **WHEN** user gets tasks by context "@home"
- **THEN** only the incomplete task is returned

### Requirement: User can get tasks by category
# implements FR8 of task-core-specs

User SHALL be able to retrieve all active, non-hidden, incomplete tasks associated with a category, sorted by `sort_order` ascending.

#### Scenario: Get tasks by category
- **GIVEN** 2 incomplete tasks associated with category "Work"
- **WHEN** user gets tasks by category "Work"
- **THEN** 2 tasks are returned, sorted by sort_order

### Requirement: User can get task counts per association
# implements FR8 of task-core-specs

System SHALL provide counts of active, non-deleted, non-completed, non-hidden tasks grouped by goal_id, context_id, or category_id. Tasks with empty association fields MUST NOT be counted.

#### Scenario: Goal task counts
- **GIVEN** 3 active incomplete tasks: 2 with goal_id "g1", 1 with goal_id "g2"
- **WHEN** user gets goal task counts
- **THEN** counts are {"g1": 2, "g2": 1}

#### Scenario: Tasks with empty goal_id not counted
- **GIVEN** 1 active incomplete task with empty goal_id
- **WHEN** user gets goal task counts
- **THEN** empty object returned (no count for empty string)

### Requirement: Soft-deleting a task cascades to checklist items
# implements FR9 of task-core-specs

When a task is soft-deleted, ALL its checklist items (including already deleted ones) MUST also be soft-deleted with `is_deleted` true, `needsSync` true, and `updated_at` refreshed.

#### Scenario: Cascade soft-delete to checklist items
- **GIVEN** task "Buy groceries" has 3 checklist items (2 active, 1 already deleted)
- **WHEN** user soft-deletes the task
- **THEN** all 3 checklist items have is_deleted true, needsSync true

#### Scenario: Soft-delete task with no checklist items
- **GIVEN** task "Buy groceries" has no checklist items
- **WHEN** user soft-deletes the task
- **THEN** task is soft-deleted, no checklist cascade needed

### Requirement: Restoring a task cascades to checklist items
# implements FR10 of task-core-specs

When a task is restored, ALL its checklist items MUST also be restored with `is_deleted` false, `needsSync` true, and `updated_at` refreshed.

#### Scenario: Cascade restore to checklist items
- **GIVEN** soft-deleted task "Buy groceries" has 3 soft-deleted checklist items
- **WHEN** user restores the task
- **THEN** all 3 checklist items have is_deleted false, needsSync true

### Requirement: User can soft-delete and restore a task
# implements FR1 of task-core-specs

User SHALL be able to soft-delete a task (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the task for sync. Soft-deleted tasks MUST NOT appear in box lists, completed lists, search, or association queries.

#### Scenario: Soft-delete a task
- **GIVEN** active task "Buy groceries" exists
- **WHEN** user soft-deletes the task
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted task
- **GIVEN** soft-deleted task "Buy groceries" exists
- **WHEN** user restores the task
- **THEN** is_deleted is false, needsSync is true

#### Scenario: Soft-deleted task excluded from box
- **GIVEN** task "Buy groceries" in inbox is soft-deleted
- **WHEN** user gets inbox tasks
- **THEN** "Buy groceries" does not appear

### Requirement: Swipe right completes or uncompletes a task
# implements FR11 of task-core-specs

User SHALL be able to swipe right on a task item. If swipe distance exceeds the activation threshold, the action is triggered: complete (for incomplete tasks) or uncomplete (for completed tasks). Below threshold, the swipe resets.

#### Scenario: Swipe right above threshold triggers action
- **WHEN** user swipes right past threshold
- **THEN** the completion/uncompletion action is triggered

#### Scenario: Swipe right below threshold resets
- **WHEN** user swipes right below threshold
- **THEN** the swipe resets, no action triggered

### Requirement: Swipe left is cancelled
# implements FR11 of task-core-specs

Swiping left on a task item MUST be cancelled immediately. No action SHALL be triggered, and translateX MUST NOT update for leftward movement.

#### Scenario: Swipe left does nothing
- **WHEN** user swipes left on a task
- **THEN** translateX remains 0, no action is triggered
