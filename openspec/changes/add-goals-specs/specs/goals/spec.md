## ADDED Requirements

### Requirement: User can create a goal

User SHALL be able to create a goal by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false, `description` to empty string, `cover_hash` to empty string, and `status` to `planning`. The `sort_order` MUST default to the count of active goals (appended to end). Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix. Implements FR1 of add-goals-specs.

#### Scenario: Create goal with name only
- **WHEN** user creates a goal with name "Learn Rust"
- **THEN** goal is persisted with name "Learn Rust", description "", cover_hash "", status "planning", revision 0, needsSync true, is_deleted false

#### Scenario: Create goal with name and description
- **WHEN** user creates a goal with name "Learn Rust" and description "Systems programming"
- **THEN** goal is persisted with both name and description preserved

#### Scenario: Create goal with explicit status
- **WHEN** user creates a goal with name "Active project" and status "in_progress"
- **THEN** goal is persisted with status "in_progress" (overrides default "planning")

#### Scenario: Sort order defaults to end of list
- **GIVEN** 3 active goals exist
- **WHEN** user creates a new goal
- **THEN** new goal has sort_order = 3

#### Scenario: UUID generated client-side
- **WHEN** user creates a goal
- **THEN** goal.id is a valid UUID v4

#### Scenario: Timestamps set on creation
- **WHEN** user creates a goal
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active goals

User SHALL be able to view a list of active (non-deleted) goals sorted by `sort_order` ascending. Soft-deleted goals MUST NOT appear in the active list. Implements FR2 of add-goals-specs.

#### Scenario: List sorted by sort_order
- **GIVEN** goals exist with sort_order 2, 0, 1
- **WHEN** user views the goals list
- **THEN** goals are returned in order: sort_order 0, 1, 2

#### Scenario: Empty list
- **GIVEN** no goals exist
- **WHEN** user views the goals list
- **THEN** an empty array is returned

#### Scenario: Soft-deleted goals excluded
- **GIVEN** 2 active goals and 1 soft-deleted goal exist
- **WHEN** user views the goals list
- **THEN** only 2 active goals are returned

### Requirement: User can update a goal

User SHALL be able to update goal name, description, cover_hash, and status. System MUST use smart dirty flag: if the update contains identical data to the current state, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed. The `id` field MUST never change. Implements FR3, FR9 of add-goals-specs.

#### Scenario: Update goal name
- **GIVEN** goal "Learn Rust" exists
- **WHEN** user updates name to "Learn Go"
- **THEN** goal name is "Learn Go", needsSync is true, updated_at is refreshed

#### Scenario: Update goal description
- **GIVEN** goal with description "Old" exists
- **WHEN** user updates description to "New"
- **THEN** description is "New", needsSync is true

#### Scenario: No-op update does not trigger sync
- **GIVEN** goal "Learn Rust" exists with needsSync false
- **WHEN** user updates name to "Learn Rust" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent goal throws error
- **WHEN** user attempts to update a goal with a nonexistent ID
- **THEN** system throws error "Goal not found: {id}"

### Requirement: User can manage goal status

Goal MUST support 5 statuses: `planning`, `in_progress`, `paused`, `completed`, `cancelled`. Transitions between ANY two statuses are allowed without restrictions. Default status on creation is `planning`. Status update uses the same smart dirty flag as general update. A convenience method `updateStatus(id, status)` MUST delegate to the general `update()` method. Implements FR8 of add-goals-specs.

#### Scenario: Change status from planning to in_progress
- **GIVEN** goal with status "planning" exists
- **WHEN** user updates status to "in_progress"
- **THEN** status is "in_progress", needsSync is true, updated_at is refreshed

#### Scenario: Change status from completed back to in_progress
- **GIVEN** goal with status "completed" exists
- **WHEN** user updates status to "in_progress"
- **THEN** status is "in_progress", needsSync is true (any-to-any transition allowed)

#### Scenario: Change status from cancelled to planning
- **GIVEN** goal with status "cancelled" exists
- **WHEN** user updates status to "planning"
- **THEN** status is "planning", needsSync is true

#### Scenario: No-op status update
- **GIVEN** goal with status "in_progress" and needsSync false
- **WHEN** user updates status to "in_progress" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

### Requirement: User can manage goal cover

Goal cover is identified by `cover_hash` field — a SHA-256 hex string (content-addressable). Setting a cover MUST be done via `update(id, { cover_hash: hash })`. Removing a cover MUST set `cover_hash` to empty string. The cover upload, download, and sync protocol is defined in the `cover-sync-protocol` capability spec. Implements FR11 of add-goals-specs.

#### Scenario: Set goal cover
- **GIVEN** goal with cover_hash "" exists
- **WHEN** user updates cover_hash to "abc123def456..."
- **THEN** cover_hash is "abc123def456...", needsSync is true

#### Scenario: Remove goal cover
- **GIVEN** goal with cover_hash "abc123def456..." exists
- **WHEN** user updates cover_hash to ""
- **THEN** cover_hash is "", needsSync is true

#### Scenario: Replace goal cover
- **GIVEN** goal with cover_hash "old_hash" exists
- **WHEN** user updates cover_hash to "new_hash"
- **THEN** cover_hash is "new_hash", needsSync is true

#### Scenario: No-op cover update
- **GIVEN** goal with cover_hash "abc123" and needsSync false
- **WHEN** user updates cover_hash to "abc123" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

### Requirement: User can soft-delete and restore a goal

User SHALL be able to soft-delete a goal (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the goal for sync. Implements FR4, FR5 of add-goals-specs.

#### Scenario: Soft-delete a goal
- **GIVEN** active goal "Learn Rust" exists
- **WHEN** user soft-deletes the goal
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted goal
- **GIVEN** soft-deleted goal "Learn Rust" exists
- **WHEN** user restores the goal
- **THEN** is_deleted is false, needsSync is true

#### Scenario: Soft-deleted goal excluded from active list
- **GIVEN** goal "Learn Rust" is soft-deleted
- **WHEN** user views the goals list
- **THEN** "Learn Rust" does not appear

### Requirement: User can reorder goals

User SHALL be able to reorder goals via drag-and-drop. System MUST assign sequential `sort_order` values (0, 1, 2...) based on position. Only goals whose `sort_order` actually changed MUST be marked for sync (`needsSync` = true). All changed goals MUST share the same `updated_at` timestamp (batch operation). Empty array MUST be a no-op. If order is unchanged, no database write occurs. Implements FR6, FR10 of add-goals-specs.

#### Scenario: Reorder assigns sequential sort_order
- **GIVEN** goals A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to B, C, A
- **THEN** B has sort_order=0, C has sort_order=1, A has sort_order=2

#### Scenario: Only changed goals marked for sync
- **GIVEN** goals A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to A, C, B
- **THEN** A has needsSync=false (unchanged), C has needsSync=true, B has needsSync=true

#### Scenario: Empty reorder is no-op
- **WHEN** user reorders with an empty array
- **THEN** no database write occurs

#### Scenario: Same order is no-op
- **GIVEN** goals A (sort_order=0), B (sort_order=1)
- **WHEN** user reorders to A, B (same order)
- **THEN** no database write occurs, no goals marked for sync

### Requirement: User can search goals

User SHALL be able to search goals by name and description. Search MUST be case-insensitive and match partial strings. Only active (non-deleted) goals are searched. Results MUST be sorted by status priority first (ascending), then by `updated_at` descending within the same status. Status priority order: `in_progress` (0) > `planning` (1) > `paused` (2) > `completed` (3) > `cancelled` (4). Implements FR7 of add-goals-specs.

#### Scenario: Search by name
- **GIVEN** goals "Learn Rust", "Learn Go", "Write book" exist
- **WHEN** user searches for "learn"
- **THEN** "Learn Rust" and "Learn Go" are returned

#### Scenario: Search by description
- **GIVEN** goal with name "Project" and description "Learn new frameworks" exists
- **WHEN** user searches for "framework"
- **THEN** "Project" is returned

#### Scenario: Case-insensitive search
- **GIVEN** goal "Learn RUST" exists
- **WHEN** user searches for "rust"
- **THEN** "Learn RUST" is returned

#### Scenario: Results sorted by status priority then updated_at
- **GIVEN** goal "A" with status "completed" updated at 11:00 and goal "B" with status "in_progress" updated at 10:00, both matching query
- **WHEN** user searches
- **THEN** "B" (in_progress, priority 0) appears before "A" (completed, priority 3)

#### Scenario: Same status sorted by updated_at descending
- **GIVEN** goal "A" with status "planning" updated at 10:00 and goal "B" with status "planning" updated at 11:00, both matching query
- **WHEN** user searches
- **THEN** "B" appears before "A" (more recently updated first)

#### Scenario: No matches returns empty
- **GIVEN** goal "Learn Rust" exists
- **WHEN** user searches for "python"
- **THEN** empty array is returned

### Requirement: Goal groups tasks

Tasks are associated with a goal via `task.goal_id` field (0..1 : N relationship). A goal can have zero or more tasks. When viewing a goal's tasks, the system separates them into active tasks and completed tasks. User SHALL be able to toggle visibility of completed tasks to either focus on active work or analyze overall goal progress. Completed tasks MUST be sorted by `completed_at` descending (most recently completed first); if `completed_at` is not available, fallback to `sort_order` descending. Detailed task management behavior is defined in the Tasks capability spec. Implements FR12, FR13 of add-goals-specs.

#### Scenario: Goal has active and completed tasks
- **GIVEN** goal "Learn Rust" has 3 active tasks and 2 completed tasks
- **WHEN** user views goal detail with completed tasks hidden (default)
- **THEN** only 3 active tasks are displayed

#### Scenario: Toggle completed tasks visibility
- **GIVEN** goal "Learn Rust" has 3 active tasks and 2 completed tasks, completed tasks are hidden
- **WHEN** user toggles completed tasks visibility on
- **THEN** 3 active tasks and 2 completed tasks are displayed, completed tasks in a separate section

#### Scenario: Completed tasks sorted by completion date
- **GIVEN** goal has task A completed at 10:00 and task B completed at 11:00
- **WHEN** user views completed tasks
- **THEN** task B appears before task A (most recently completed first)

#### Scenario: Goal with no tasks
- **GIVEN** goal "New goal" has no associated tasks
- **WHEN** user views goal detail
- **THEN** empty task list is displayed

#### Scenario: Completed tasks hidden by default
- **WHEN** user navigates to goal detail page
- **THEN** completed tasks section is hidden by default
