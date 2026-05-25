# Search Specs

## Why

Search functionality is implemented (SearchPage, useSearch, searchByName in services), but cross-entity behavior is not specified. Search specs for individual entities (tasks, goals, ideas) already exist in stable specifications, but there is no unified spec for:
- parallel search across three entities (useSearch)
- SearchPage UI behavior (debounce, empty query, no results)
- error handling during search
- inline interaction with results (complete/edit/delete tasks, navigate to goals, edit ideas)

There are also no BDD unit tests for cross-entity useSearch behavior.

## What Changes

- ADDED: unified cross-entity search specification
- ADDED: BDD unit tests for useSearch hook (parallel search, empty query, errors, clear)

## Goals

- G1: Document cross-entity search behavior in a unified spec
- G2: Cover useSearch with BDD unit tests

## Non-Goals

- NG1: Do not modify existing search implementation
- NG2: Do not change existing entity-level specs (tasks, goals, ideas)
- NG3: Do not add E2E tests for SearchPage (separate change)

## Users & Scenarios

- U1: User enters a query and sees results across tasks, goals, and ideas simultaneously
- U2: User enters a query and no entity matches — sees "no results"
- U3: Search for one entity fails — all results are cleared

## Requirements

### Functional

- FR1: useSearch SHALL perform parallel search across tasks, goals, and ideas via Promise.all
- FR2: Empty query SHALL clear all results without calling any services
- FR3: When any service throws an error, all results SHALL be cleared
- FR4: clear() method SHALL reset all results
- FR5: isSearching SHALL be true during search execution and false after completion (including errors)

### Non-Functional

#### Performance
- NFR-P1: SearchPage SHALL use 300ms debounce for triggering search

#### Accessibility
- NFR-A1: Search input SHALL have an aria-label
- NFR-A2: Result sections SHALL have aria-labels

## UX Acceptance Criteria

- UX1: Before entering a query, a hint "start typing" is shown
- UX2: When no results are found, "nothing found" is shown
- UX3: Results are grouped by type: tasks, goals, ideas (in this order)
- UX4: During search, the input field shows reduced opacity

## UI States Matrix

| State      | Query | isSearching | Results | UI                                    |
|------------|-------|-------------|---------|---------------------------------------|
| Empty      | ""    | false       | []      | Hint "start typing"                   |
| Searching  | "buy" | true        | []      | Input field with opacity-60           |
| No results | "xyz" | false       | []      | "Nothing found"                       |
| Results    | "buy" | false       | [...]   | Sections: Tasks, Goals, Ideas         |

## Behavior

Reference to feature files:
- `features/search/cross_entity_search.feature` (@search-specs tags)

## Affected IA

No changes.

## Success Metrics

- M1: Cross-entity search spec is created and covers FR1-FR5
- M2: BDD unit tests for useSearch cover all scenarios from the spec
- M3: Mutation score >=95% on useSearch hook

## Capabilities

### New Capabilities
- `search`: Cross-entity search — parallel search across tasks, goals, and ideas, error handling, UI states

### Modified Capabilities

None.

## Impact

- New files: `openspec/specs/search/spec.md`, BDD feature + steps for useSearch
- Existing code is not modified
