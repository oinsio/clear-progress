## Context

The GAS backend (`packages/adapter-gas`) is the original backend for Clear Progress. It has extensive unit tests (~60 test files) but no formal OpenSpec specifications and no BDD feature files. The Supabase backend has 6 specs. This change closes the documentation gap by creating 3 new capability specs and BDD tests for GAS-specific behavior.

The GAS adapter package has two sides:
- **Client** (`src/client/gas-sync-adapter.ts`) — `GasSyncAdapter` class implementing `SyncAdapter` port via HTTP POST to GAS web app URL
- **Server** (`src/server/`) — Google Apps Script code: `doGet`/`doPost` entry points, action handlers, Google Sheets CRUD, Drive for covers, authentication via Google tokeninfo API

Existing unit tests in `packages/adapter-gas` already cover most behavior. The new BDD tests will formalize requirements in Gherkin and reuse existing test infrastructure.

## Goals / Non-Goals

**Goals:**
- Formal specs for 3 GAS-specific capabilities (FR1-FR14)
- BDD feature files with step definitions covering GAS adapter, server, and sheets
- Reuse existing test mocks and utilities — no new test infrastructure

**Non-Goals:**
- Changing any implementation code
- Duplicating backend-agnostic sync protocol behavior (already in sync-protocol spec)
- Creating integration tests against live GAS deployment

## Decisions

### D1: BDD tests go inside `packages/adapter-gas`

BDD feature files will be placed in `packages/adapter-gas/src/test/features/` rather than `packages/client/src/test/features/`. Rationale: GAS adapter and server code lives in `packages/adapter-gas`, and the existing test setup (GAS API mocks, sheet test utilities) is already configured there.

Alternative considered: placing in `packages/client` alongside sync protocol BDD tests. Rejected because GAS-specific behavior (Google Sheets coercion, Drive API, tokeninfo) has nothing to do with the client package.

### D2: Reuse existing test utilities for GAS mocks

Step definitions will import from existing test helpers:
- `tests/server/setup/gas-mocks.ts` — SpreadsheetApp, PropertiesService, Drive mocks
- `tests/server/helpers/` — cover mocks, response helpers
- `src/server/sheets/base-test-utils.ts` — sheet CRUD test utilities

Alternative considered: writing fresh mocks in step files. Rejected — duplicates existing well-tested infrastructure.

### D3: Three separate specs mirror Supabase documentation structure

Creating `gas-adapter`, `gas-server`, `gas-sheets-schema` mirrors the Supabase pattern (`supabase-adapter`, `supabase-edge-functions`, `supabase-schema`). This makes it easy to compare backend implementations side-by-side.

### D4: Specs document existing behavior, not aspirational

All spec requirements are extracted from reading existing code. No new behavior is specified. This is a "document what exists" change.

## Risks / Trade-offs

- [Risk] BDD tests may overlap with existing unit tests → Mitigation: BDD tests focus on behavior contracts (Given-When-Then), not implementation details. Some overlap is acceptable for specification clarity.
- [Risk] vitest-cucumber may not be configured in `packages/adapter-gas` → Mitigation: Check existing vitest config; add vitest-cucumber dependency if needed.
- [Risk] Specs may become stale if GAS code changes → Mitigation: Specs are linked to BDD tests via traceability tags; failing tests signal spec drift.
