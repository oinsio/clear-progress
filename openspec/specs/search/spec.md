# Capability: Search

## Purpose

Cross-entity search across tasks, goals, and ideas. Orchestrates parallel search via individual entity services, manages search state (loading, results, errors), and provides clear/reset functionality.

Delegates entity-specific search logic (filtering, sorting) to TaskService, GoalService, and IdeaService — see their respective specs.

## Requirements

### Requirement: Parallel cross-entity search

useSearch SHALL execute search across tasks, goals, and ideas in parallel via Promise.all. All three entity services' searchByName methods SHALL be called with the same query string. Results SHALL be stored separately by entity type.

#### Scenario: Search returns results from all entity types

- **WHEN** user searches for "learn" and tasks, goals, and ideas match
- **THEN** results contain matching tasks, goals, and ideas

#### Scenario: Search returns partial results

- **WHEN** user searches for "buy" and only tasks match
- **THEN** tasks contain matches, goals and ideas are empty arrays

### Requirement: Empty query clears results

Empty query (empty string) SHALL clear all results immediately without calling any search service.

#### Scenario: Empty query clears all results

- **GIVEN** previous search returned results
- **WHEN** user searches with empty string
- **THEN** tasks, goals, and ideas are all empty arrays
- **AND** no service searchByName methods are called

### Requirement: Error handling clears all results

If any of the three search services throws an error, ALL results SHALL be cleared (tasks, goals, ideas set to empty arrays). The error SHALL be logged to console.

#### Scenario: One service fails clears all results

- **GIVEN** taskService.searchByName throws an error
- **WHEN** user searches for "buy"
- **THEN** tasks, goals, and ideas are all empty arrays

#### Scenario: Error is logged

- **GIVEN** goalService.searchByName throws an error
- **WHEN** user searches for "learn"
- **THEN** error is logged to console

### Requirement: Clear method resets results

clear() method SHALL reset tasks, goals, and ideas to empty arrays.

#### Scenario: Clear resets all results

- **GIVEN** previous search returned results
- **WHEN** user calls clear
- **THEN** tasks, goals, and ideas are all empty arrays

### Requirement: Search loading state

isSearching SHALL be true while search is in progress and false after completion (both success and error). isSearching SHALL be false initially.

#### Scenario: Initial state

- **WHEN** useSearch is initialized
- **THEN** isSearching is false
- **AND** tasks, goals, and ideas are empty arrays

#### Scenario: isSearching is true during search

- **WHEN** search is in progress
- **THEN** isSearching is true

#### Scenario: isSearching is false after search completes

- **WHEN** search completes successfully
- **THEN** isSearching is false

#### Scenario: isSearching is false after search error

- **WHEN** search fails with error
- **THEN** isSearching is false

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
