# Add Context & Category Specs

## Why

Context (contexts: @home, @work, @errands) and Category (task categories) are fully implemented (domain, repository, service, hooks, UI, sync) but lack formal OpenSpec specifications and BDD tests. Business rules are not captured as executable specifications, creating a documentation gap.

## What Changes

- **ADDED**: OpenSpec specification for Contexts capability (`openspec/specs/contexts/spec.md`)
- **ADDED**: OpenSpec specification for Categories capability (`openspec/specs/categories/spec.md`)
- **ADDED**: BDD unit tests (vitest-cucumber) covering CRUD, soft delete, reorder, smart dirty flag for both entities

## Goals

- G1: Every Context and Category business rule has an executable Gherkin specification
- G2: Capability specs document all requirements with scenarios

## Non-Goals

- NG1: Changing any application code — this is documentation and tests only
- NG2: Migrating existing unit tests to BDD — they complement each other
- NG3: Adding new features to Context or Category
- NG4: E2E tests — can be a separate change

## Users & Scenarios

- U1: Developer modifies ContextService/CategoryService logic -> BDD tests catch regressions
- U2: New developer reads spec.md -> understands all capabilities without reading code
- U3: Developer adds a new entity -> uses Context/Category specs as a template

## Requirements

### Functional

- FR1: User can create a context/category with a name (UUID client-side, revision 0, needsSync true, sort_order = count of active)
- FR2: User can view list of active contexts/categories sorted by sort_order ascending
- FR3: User can update context/category name (smart dirty flag: identical update does not trigger sync)
- FR4: User can soft-delete a context/category
- FR5: User can restore a soft-deleted context/category
- FR6: User can reorder contexts/categories (sequential sort_order, only changed entities marked for sync)

## UX Acceptance Criteria

_No new UX criteria — existing UI is not changing._

## Behavior

See `packages/client/src/test/features/contexts/*.feature` (tags `@add-context-category-specs`)
See `packages/client/src/test/features/categories/*.feature` (tags `@add-context-category-specs`)

## Affected IA

No changes. Routes `/contexts` and `/categories` already exist.

## Success Metrics

- M1: All BDD unit scenarios pass (100% green)
- M2: Build passes without errors
- M3: Every FR has at least one BDD scenario with traceability tag

## Open Questions

_No open questions._

## Capabilities

### New Capabilities

- `contexts`: contexts for task filtering by location/situation (@home, @work, @errands)
- `categories`: Task categories for thematic grouping

### Modified Capabilities

_No changes to existing specs._

## Impact

- `openspec/specs/contexts/` — new spec
- `openspec/specs/categories/` — new spec
- `packages/client/src/test/features/contexts/` — new BDD tests
- `packages/client/src/test/features/categories/` — new BDD tests
- No application code changes
