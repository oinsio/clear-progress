# Purge Specs and Tests

## Why

The purge functionality (hard-deleting soft-deleted records) is fully implemented, but only documented as part of the sync-protocol spec (3 scenarios in FR6). There is no dedicated specification covering server-side validation (`confirm === true`), response structure, per-entity-type behavior, and error handling. BDD tests cover only the sync level (pull/push/purge coordination), not server-side validation and edge cases.

## What Changes

- **ADDED**: Dedicated `purge` specification with full requirement coverage
- **MODIFIED**: `sync-protocol` — add cross-reference to the dedicated purge spec
- **VERIFIED**: Existing tests match the specification

## Goals

- G1: Every aspect of purge behavior is documented in a specification with a unique ID
- G2: Existing tests are verified against the specification

## Non-Goals

- NG1: Changing the existing purge implementation
- NG2: E2E tests for purge UI (DeletedPage)
- NG3: Changing existing BDD tests in sync_soft_delete

## Users & Scenarios

- U1: Developer — reads the purge specification to understand behavior
- U2: AI agent — uses the specification to generate code when making changes

## Requirements

### Functional

- FR1: Purge spec describes the strict confirmation requirement (`confirm === true`)
- FR2: Purge spec describes PurgeResponse structure (ok, purged counts for 6 entity types, purge_revision)
- FR3: Purge spec describes deletion behavior per entity type (tasks, goals, contexts, categories, checklist_items, ideas)
- FR4: Purge spec describes purge_revision increment after successful purge
- FR5: Purge spec describes error handling (INVALID_PAYLOAD when confirm is missing)
- FR6: Existing unit tests verified against the specification (purge.validation.test.ts, purge.deletion.test.ts)
- FR7: Existing BDD tests (sync_soft_delete.feature) verified against the specification
- FR8: Existing contract tests (sync-adapter.contract.ts) verified against the specification

### Non-Functional

#### Performance
- NFR-P1: Specification and tests do not affect performance (documentation-only change)

## UX Acceptance Criteria

- UX1: Not applicable — documentation and tests only

## Behavior

- Sync-level purge coordination: `packages/client/src/test/features/sync_protocol/sync_soft_delete.feature`
- Server validation (unit): `packages/adapter-gas/src/server/actions/purge.validation.test.ts`
- Server deletion (unit): `packages/adapter-gas/src/server/actions/purge.deletion.test.ts`
- Contract tests: `packages/contract/tests/contracts/sync-adapter.contract.ts`

## Affected IA

No changes.

## Success Metrics

- M1: Purge spec created with >= 5 requirements
- M2: All existing tests pass (`npx vitest run`)
- M3: Every requirement in the specification traces to at least one test

## Capabilities

### New Capabilities

- `purge`: Full description of the purge operation — server validation, soft-deleted record removal, response structure, purge_revision increment

### Modified Capabilities

- `sync-protocol`: Add cross-reference to the dedicated purge spec instead of inline description

## Impact

- `openspec/specs/purge/spec.md` — new file
- `openspec/specs/sync-protocol/spec.md` — delta with cross-reference
- Existing tests — verification against the specification

## Open Questions

- ~~Q1: Should the purge spec also describe the client-side part (SyncService.purge, pull detection) or leave it in sync-protocol?~~ **Resolved**: server-side purge in purge spec, client-side coordination in sync-protocol. Cross-references between specs.
