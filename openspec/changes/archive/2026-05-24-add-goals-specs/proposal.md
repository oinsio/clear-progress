# Add Goals Specs

## Why

The Goals feature is fully implemented (domain, repository, service, hooks, UI, covers, statuses, search, sync) but lacks formal OpenSpec specification and BDD tests. Other entities (Ideas, Categories, Contexts) already have both specs and BDD tests. Goals are the most complex entity (5 statuses, covers, task grouping, search with status priority) and this gap creates risk: business rules are not captured as executable specifications.

## What Changes

- **ADDED**: OpenSpec specification for Goals capability (`openspec/specs/goals/spec.md`) — already drafted
- **ADDED**: BDD unit tests (vitest-cucumber) covering CRUD, statuses, covers, soft delete, reorder, search, dirty flag, goal-task grouping

## Goals

- G1: Every Goals business rule has an executable Gherkin specification
- G2: Goals spec follows the same pattern as Ideas, Categories, and Contexts specs

## Non-Goals

- NG1: Changing any application code — this is documentation and tests only
- NG2: Migrating existing unit tests to BDD — they complement each other
- NG3: Adding new features to Goals
- NG4: BDD E2E tests — will be added in a separate change if needed
- NG5: Writing a Tasks capability spec — will be a separate change

## Users & Scenarios

- U1: Developer modifies GoalService logic -> BDD tests catch regressions in business rules
- U2: New developer reads spec.md -> understands all Goals capabilities without reading code
- U3: Developer changes search sorting -> BDD tests verify status priority ordering is preserved

## Requirements

### Functional

- FR1: User can create a goal with a name (UUID client-side, revision 0, needsSync true, status "planning", cover_hash "", description "")
- FR2: User can view list of active goals sorted by sort_order ascending
- FR3: User can update goal name, description, cover_hash, and status
- FR4: User can soft-delete a goal (is_deleted = true)
- FR5: User can restore a soft-deleted goal (is_deleted = false)
- FR6: User can reorder goals via drag-and-drop (sequential sort_order)
- FR7: User can search goals by name and description (case-insensitive, sorted by status priority then updated_at descending)
- FR8: Goal supports 5 statuses: planning, in_progress, paused, completed, cancelled — any-to-any transitions allowed
- FR9: Update with identical data does not set needsSync or change updated_at (smart dirty flag)
- FR10: Reorder marks only goals with changed sort_order for sync
- FR11: Goal cover is identified by cover_hash (SHA-256 hex string, content-addressable); set/remove via update
- FR12: Goal groups tasks via task.goal_id (0..1 : N); completed tasks sorted by completed_at descending
- FR13: User can toggle visibility of completed tasks on goal detail page (hidden by default)

### Non-Functional

#### Accessibility

- NFR-A1: Status badges have accessible text labels for screen readers

## UX Acceptance Criteria

- UX1: Completed tasks section is hidden by default on goal detail page
- UX2: Toggle button switches between showing and hiding completed tasks

## Behavior

See `packages/client/src/test/features/goals/*.feature` (tags `@add-goals-specs`)

## Affected IA

No changes. Route `/goals` and `/goals/:id` already exist.

## Success Metrics

- M1: All BDD unit scenarios pass (100% green)
- M2: Mutation testing score >= 90% on new BDD step definitions

## Open Questions

_No open questions._

## Capabilities

### New Capabilities

- `goals`: Management of objectives with statuses, covers, search, task grouping, and manual sort order

### Modified Capabilities

_No changes to existing specs._

## Impact

- `openspec/specs/goals/` — spec already drafted, will be finalized
- `packages/client/src/test/features/goals/` — new BDD feature files and step definitions
- No application code changes
