# Capability: Repeating Tasks

## ADDED Requirements

### Requirement: System deduplicates recurring copies after pull
# implements FR1, FR2 of dedup-recurring-after-pull

After applying a pull batch, the system SHALL detect duplicate recurring copies — multiple non-completed, non-deleted tasks sharing the same `original_task_id`. Among duplicates, the system SHALL keep the winner by earliest `next_date`, tiebreak by lexicographically smallest `id`. Losers SHALL be soft-deleted with `syncStatus: "pending"`.

#### Scenario: Two duplicates with same next_date — tiebreak by id
- **GIVEN** task Copy-A (id="aaa...", original_task_id="root", next_date="2026-07-01") and Copy-B (id="bbb...", original_task_id="root", next_date="2026-07-01"), both non-completed, non-deleted
- **WHEN** deduplication runs after pull
- **THEN** Copy-A is kept (smaller id) and Copy-B is soft-deleted

#### Scenario: Two duplicates with different next_date — earlier wins
- **GIVEN** task Copy-A (original_task_id="root", next_date="2026-07-05") and Copy-B (original_task_id="root", next_date="2026-07-01"), both non-completed, non-deleted
- **WHEN** deduplication runs after pull
- **THEN** Copy-B is kept (earlier next_date) and Copy-A is soft-deleted

#### Scenario: No duplicates — no action
- **GIVEN** only one non-completed, non-deleted task per original_task_id
- **WHEN** deduplication runs after pull
- **THEN** no tasks are modified

#### Scenario: Completed copies are excluded from dedup
- **GIVEN** Copy-A (original_task_id="root", is_completed=true) and Copy-B (original_task_id="root", is_completed=false)
- **WHEN** deduplication runs after pull
- **THEN** no deduplication occurs (only one non-completed copy exists)

#### Scenario: Deleted copies are excluded from dedup
- **GIVEN** Copy-A (original_task_id="root", is_deleted=true) and Copy-B (original_task_id="root", is_deleted=false)
- **WHEN** deduplication runs after pull
- **THEN** no deduplication occurs (only one non-deleted copy exists)

### Requirement: Deduplication cascades soft-delete to checklist items
# implements FR3 of dedup-recurring-after-pull

When a duplicate recurring copy is soft-deleted during deduplication, the system SHALL also soft-delete all checklist items belonging to that copy. Each cascaded checklist item SHALL have `is_deleted: true`, `syncStatus: "pending"`, and `updated_at` set to the current timestamp.

#### Scenario: Duplicate with checklist items is soft-deleted
- **GIVEN** Copy-B is a duplicate loser with checklist items C1 and C2
- **WHEN** deduplication soft-deletes Copy-B
- **THEN** C1 has is_deleted=true, syncStatus="pending"
- **AND** C2 has is_deleted=true, syncStatus="pending"

#### Scenario: Duplicate without checklist items is soft-deleted
- **GIVEN** Copy-B is a duplicate loser with no checklist items
- **WHEN** deduplication soft-deletes Copy-B
- **THEN** only Copy-B is soft-deleted, no error occurs

### Requirement: Deduplication runs before sync_complete event
# implements FR4 of dedup-recurring-after-pull

Deduplication SHALL execute after the pull batch is applied to IndexedDB but BEFORE the `sync_complete` event is dispatched. This ensures `revealHiddenTasks` (which listens to `sync_complete`) never sees duplicate copies.

#### Scenario: Reveal sees clean data after dedup
- **GIVEN** pull batch contains two duplicates with appear_date <= today
- **WHEN** pull completes and sync_complete fires
- **THEN** revealHiddenTasks reveals only one task (the winner)

### Requirement: Deduplication is skipped when unnecessary
# implements FR5 of dedup-recurring-after-pull

Deduplication SHALL be skipped when the pull batch contains no tasks with non-empty `original_task_id`. This avoids unnecessary IndexedDB queries on normal pulls.

#### Scenario: Pull with no recurring data skips dedup
- **GIVEN** pull batch contains only tasks with original_task_id=""
- **WHEN** pull completes
- **THEN** deduplication query is not executed
