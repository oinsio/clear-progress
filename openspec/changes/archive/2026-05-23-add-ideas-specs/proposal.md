# Add Ideas Specs

## Why

The Ideas feature is fully implemented (domain, repository, service, hooks, UI, sync) but lacks formal OpenSpec specification and BDD tests. This creates a gap in documentation and test coverage — business rules are not captured as executable specifications, and non-functional requirements (a11y, responsive) have no automated verification.

## What Changes

- **ADDED**: OpenSpec specification for Ideas capability (`openspec/specs/ideas/spec.md`)
- **ADDED**: BDD unit tests (vitest-cucumber) covering CRUD, soft delete, reorder, search, smart dirty flag
- **ADDED**: BDD E2E tests (playwright-bdd) covering keyboard accessibility, responsive layout, empty state

## Goals

- G1: Every Ideas business rule has an executable Gherkin specification
- G2: Non-functional requirements (a11y, responsive) are verified by automated E2E tests

## Non-Goals

- NG1: Changing any application code — this is documentation and tests only
- NG2: Migrating existing unit tests to BDD — they complement each other
- NG3: Adding new features to Ideas

## Users & Scenarios

- U1: Developer modifies IdeaService logic -> BDD tests catch regressions in business rules
- U2: Developer changes IdeasPage layout -> E2E tests catch a11y and responsive regressions
- U3: New developer reads spec.md -> understands all Ideas capabilities without reading code

## Requirements

### Functional

- FR1: User can create an idea with a name (UUID client-side, revision 0, needsSync true)
- FR2: User can view list of active ideas sorted by sort_order ascending
- FR3: User can update idea name and description (save-on-blur pattern)
- FR4: User can soft-delete an idea with confirmation dialog
- FR5: User can restore a soft-deleted idea
- FR6: User can reorder ideas via drag-and-drop (sort_order updated)
- FR7: User can search ideas by name and description (case-insensitive, results sorted by updated_at descending)
- FR8: Created idea has defaults: description="", sort_order=count of active ideas
- FR9: Update with identical data does not set needsSync or change updated_at (smart dirty flag)
- FR10: Reorder marks only ideas with changed sort_order for sync
- FR11: Ideas sync across devices via pull/push protocol

### Non-Functional

#### Accessibility

- NFR-A1: Idea list items are keyboard navigable (Tab through edit, drag buttons)
- NFR-A2: All interactive elements have aria-labels (edit, delete, drag, add buttons)
- NFR-A3: Delete confirmation dialog is keyboard accessible (Escape closes, Tab moves between buttons)

#### Responsive

- NFR-R1: Detail panel shows as side panel on desktop, full-screen overlay on mobile

## UX Acceptance Criteria

- UX1: Empty state shows a message prompting user to add the first idea
- UX2: Unsynced ideas (needsSync=true) show amber left border indicator
- UX3: Inline creation via textarea with Enter to submit, Escape/blur to cancel
- UX4: Idea description visible as truncated text in list item

## Behavior

See `packages/client/src/test/features/ideas/*.feature` (tags `@add-ideas-specs`)

## Affected IA

No changes. Route `/ideas` already exists.

## Success Metrics

- M1: All BDD unit scenarios pass (100% green)
- M2: All BDD E2E scenarios pass (100% green)
- M3: Mutation testing score >= 95% on IdeaService

## Open Questions

_No open questions._

## Capabilities

### New Capabilities

- `ideas`: Lightweight capture and management of ideas with ordering, search, and cross-device sync

### Modified Capabilities

_No changes to existing specs._

## Impact

- `openspec/specs/ideas/` — new spec
- `packages/client/src/test/features/ideas/` — new BDD tests
- No application code changes
