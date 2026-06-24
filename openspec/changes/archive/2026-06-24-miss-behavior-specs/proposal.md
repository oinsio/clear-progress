# miss-behavior-specs

## Why

Several implemented features lack BDD Gherkin specifications, creating a gap between working code and documented behavior. CompletedPage has 63+ unit tests but zero BDD feature files. FocusMode UI-dimming logic (which tasks get dimmed when one is selected/expanded) is covered only by unit tests, not by Gherkin scenarios. SyncProvider has a stale traceability comment referencing `localstorage-refactor` instead of `sync-orchestration`.

## What Changes

- **ADDED**: BDD feature file for CompletedPage view behavior (date grouping, operations routing, empty state)
- **ADDED**: BDD feature file for FocusMode UI-dimming logic (dimming rules for selected/expanded tasks)
- **MODIFIED**: SyncProvider.tsx traceability comment to reference correct spec

## Goals

- G1: Every implemented behavior has a corresponding Gherkin specification
- G2: Traceability comments accurately reference the specs they implement

## Non-Goals

- NG1: No new functionality — only specs and traceability fixes for existing code
- NG2: No E2E tests — this change covers BDD unit specs only
- NG3: No refactoring of existing implementations

## Users & Scenarios

- U1: Developer reading specs to understand CompletedPage grouping logic
- U2: Developer reading specs to understand FocusMode dimming rules
- U3: AI agent verifying traceability links are accurate

## Requirements

### Functional

- FR1: BDD feature file for CompletedPage SHALL cover date grouping (today/yesterday/week/month/earlier)
- FR2: BDD feature file for CompletedPage SHALL cover empty state display
- FR3: BDD feature file for CompletedPage SHALL cover task operation routing (update/move/delete/duplicate dispatch to original box)
- FR4: BDD feature file for FocusMode dimming SHALL cover dimming activation conditions (focus mode ON + task selected or expanded)
- FR5: BDD feature file for FocusMode dimming SHALL cover which tasks are dimmed vs not dimmed (selected and expanded tasks are never dimmed)
- FR6: BDD feature file for FocusMode dimming SHALL cover dimming deactivation (focus mode OFF = no dimming)
- FR7: SyncProvider.tsx traceability comment SHALL reference sync-orchestration spec triggers T1-T7

### Non-Functional

#### Accessibility

- NFR-A1: N/A (specs only, no UI changes)

#### Performance

- NFR-P1: N/A (specs only, no runtime changes)

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/completed_page/completed_page_grouping.feature` — @miss-behavior-specs @FR1 @FR2
- `features/completed_page/completed_page_operations.feature` — @miss-behavior-specs @FR3
- `features/focus_mode/focus_mode_dimming.feature` — @miss-behavior-specs @FR4 @FR5 @FR6

## Affected IA

No changes.

## Success Metrics

- M1: All new BDD scenarios pass with `npx vitest run`
- M2: SyncProvider traceability comment references sync-orchestration spec
- M3: Mutation score for step definitions >=90%

## Open Questions

None.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `task-page-layout`: Adding BDD scenarios for CompletedPage view behavior (FR1, FR2, FR3)
- `local-preferences`: Adding BDD scenarios for FocusMode UI-dimming logic (FR4, FR5, FR6)
- `sync-orchestration`: Fixing traceability comment in SyncProvider.tsx (FR7)
