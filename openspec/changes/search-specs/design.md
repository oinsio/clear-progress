## Context

Search functionality is implemented across three layers:
1. **Services** — `searchByName(query)` in TaskService, GoalService, IdeaService (specified in entity-level specs)
2. **useSearch hook** — orchestrates parallel search, manages state
3. **SearchPage** — UI with debounce, grouped results, inline interaction

Specs for layer 1 already exist. This change adds a spec for layer 2 (useSearch) and BDD tests.

## Goals / Non-Goals

**Goals:**
- Specify cross-entity useSearch behavior (FR1-FR5)
- Cover with BDD unit tests

**Non-Goals:**
- Modify the implementation
- Write E2E tests for SearchPage

## Decisions

### D1: Spec describes useSearch hook, not SearchPage

**Rationale**: SearchPage is the UI layer that depends on useSearch. Cross-entity business logic (parallel search, error handling) lives in the hook. UI behavior (debounce, inline-edit) is presentation logic that does not require a spec.

**Alternative**: Describe everything in a single spec with SearchPage. Rejected — mixing layers complicates testing and maintenance.

### D2: BDD tests at the useSearch hook level (vitest-cucumber)

**Rationale**: Unit tests for useSearch already exist, but there are no Gherkin scenarios. BDD unit tests with vitest-cucumber close the gap in executable specifications.

### D3: Feature file in a separate search/ folder

**Rationale**: Search is a cross-entity capability that does not belong to tasks, goals, or ideas. A separate `features/search/` folder is logical.

## Risks / Trade-offs

- [Duplication] Some BDD scenarios for useSearch overlap with unit tests in useSearch.*.test.ts → Acceptable: BDD serves as executable spec, unit tests provide detailed coverage. Different purposes.
