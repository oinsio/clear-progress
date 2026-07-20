# Delta: Search — fix-search-page-sync-push

## ADDED Requirements

### Requirement: Mutations from search schedule a sync push

Every data mutation initiated from the search page SHALL call `schedulePush()` after the local write succeeds, consistent with the sync-orchestration rule that any local data mutation schedules a debounced push. This covers task mutations — complete, noncomplete, update, move to box, soft delete, duplicate — and idea mutations — update, soft delete. `schedulePush` SHALL be obtained via `useSync()`. <!-- implements FR1, FR2, FR3 of fix-search-page-sync-push -->

#### Scenario: Completing a task from search results schedules a push

- **WHEN** the user completes (or uncompletes) a task from the search results list
- **THEN** the task is written locally
- **AND** `schedulePush()` is called exactly once

#### Scenario: Editing, moving, deleting, or duplicating a task from search schedules a push

- **WHEN** the user updates, moves, soft-deletes, or duplicates a task from search results or the task detail panel opened from search
- **THEN** the mutation is written locally
- **AND** `schedulePush()` is called exactly once per mutation

#### Scenario: Editing or deleting an idea from search schedules a push

- **WHEN** the user updates or soft-deletes an idea from the idea detail panel opened from search
- **THEN** the mutation is written locally
- **AND** `schedulePush()` is called exactly once per mutation

#### Scenario: Search itself does not schedule a push

- **WHEN** the user types a query and search executes (no mutation)
- **THEN** `schedulePush()` is not called
