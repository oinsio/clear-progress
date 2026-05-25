# GAS Adapter Specs and BDD Tests

## Why

The Supabase backend has comprehensive OpenSpec documentation (6 specs: supabase-adapter, supabase-schema, supabase-edge-functions, supabase-auth, supabase-ui-connection, supabase-integration-tests), but the Google Apps Script (GAS) backend — the original and actively used backend — has no formal specifications. This creates an asymmetry in documentation coverage. Additionally, while the GAS server has unit tests (`packages/adapter-gas`), there are no BDD feature files (`.feature`) covering GAS-specific behavior (Google Sheets storage, GAS server actions, GAS client adapter). Formalizing specs and adding BDD tests will close this gap.

## What Changes

### ADDED capabilities:
- `gas-adapter` — Formal spec for the GAS client-side adapter (`GasSyncAdapter`) that implements `SyncAdapter` interface via HTTP POST to GAS web app
- `gas-server` — Formal spec for the GAS server: action routing (`doGet`/`doPost`), authentication (Google OAuth token verification), and action dispatch
- `gas-sheets-schema` — Formal spec for the Google Sheets storage layer: sheet structure, column headers, data type coercion (booleans, dates, timestamps), CRUD operations (`getAllRecords`, `upsertRecord`, `upsertRecords`, `deleteRecordsByIds`), and Meta sheet (revision/purge counters)

### NO removals, NO breaking changes.

## Capabilities

### New Capabilities
- `gas-adapter`: Client-side GAS adapter — HTTP transport, auth token injection, Zod validation, timeout, ping via GET, error mapping (ApiAuthError, ApiValidationError)
- `gas-server`: GAS server entry points — doGet/doPost routing, authentication via Google tokeninfo API, owner email auto-registration, action dispatch, error response format
- `gas-sheets-schema`: Google Sheets as database — sheet names, column headers per entity, data type coercion (booleans, dates, timestamps), base CRUD operations, Meta sheet for revision tracking, date-only field storage with apostrophe prefix

### Modified Capabilities
_(none — existing sync-protocol, sync-orchestration, cover-sync-protocol specs are backend-agnostic and remain unchanged)_

## Goals

- G1: Every GAS-specific implementation detail has a corresponding formal spec
- G2: BDD tests (vitest-cucumber) cover GAS adapter, server, and sheets behavior
- G3: Documentation parity between GAS and Supabase backends

## Non-Goals

- NG1: Changing any existing GAS implementation — this is documentation-only
- NG2: Covering backend-agnostic sync protocol (already in sync-protocol spec)
- NG3: Integration/E2E tests against live GAS deployment
- NG4: Supabase spec modifications

## Requirements

### Functional

- FR1: `gas-adapter` spec documents all 9 SyncAdapter methods in GasSyncAdapter and their HTTP transport behavior
- FR2: `gas-adapter` spec documents ping via GET (no auth), all other actions via POST with `access_token`
- FR3: `gas-adapter` spec documents Zod schema validation of all responses and error mapping
- FR4: `gas-adapter` spec documents request timeout (30s) with AbortController
- FR5: `gas-server` spec documents doGet (ping only) and doPost (all other actions) routing
- FR6: `gas-server` spec documents authentication: token verification via Google tokeninfo API, owner email auto-registration, and failure reasons
- FR7: `gas-server` spec documents error response format (`{ ok: false, error: CODE, message: "..." }`)
- FR8: `gas-sheets-schema` spec documents sheet structure: 8 sheets (Tasks, Goals, Contexts, Categories, Checklist_Items, Ideas, Settings, Meta) with column headers
- FR9: `gas-sheets-schema` spec documents data type coercion: booleans (`TRUE`/`FALSE` strings), timestamps (Date→ISO 8601), date-only fields (apostrophe prefix to prevent auto-conversion)
- FR10: `gas-sheets-schema` spec documents base CRUD operations: getAllRecords, upsertRecord, upsertRecords, deleteRecordsByIds
- FR11: `gas-sheets-schema` spec documents Meta sheet: `next_revision` (starts at 1) and `purge_revision` (starts at 0)
- FR12: BDD feature files cover GAS adapter behavior (auth, transport, validation, timeout, error mapping)
- FR13: BDD feature files cover GAS server routing and authentication
- FR14: BDD feature files cover Google Sheets storage operations and data coercion

### Non-Functional

#### Performance
- NFR-P1: No performance impact — documentation-only change

#### Accessibility
_(N/A — no UI changes)_

#### Responsive
_(N/A — no UI changes)_

## UX Acceptance Criteria
_(N/A — no UI changes)_

## Behavior

- `packages/adapter-gas/src/test/features/gas_adapter/*.feature` — BDD scenarios for GAS client adapter (`@gas-adapter-specs-and-bdd`)
- `packages/adapter-gas/src/test/features/gas_server/*.feature` — BDD scenarios for GAS server (`@gas-adapter-specs-and-bdd`)
- `packages/adapter-gas/src/test/features/gas_sheets/*.feature` — BDD scenarios for Google Sheets storage (`@gas-adapter-specs-and-bdd`)

## Visual Reference
_(N/A — no UI changes)_

## Affected IA
No changes.

## Success Metrics

- M1: 3 new OpenSpec capability specs created (gas-adapter, gas-server, gas-sheets-schema)
- M2: All BDD feature files have passing step definitions
- M3: Mutation testing score >= 90% on new step definition code

## Open Questions

_(all resolved)_

- ~Q1: Should GAS server BDD tests mock GAS APIs (SpreadsheetApp, Drive, PropertiesService) at the step level, or reuse existing test utilities from `packages/adapter-gas/tests/server/`?~ — **Resolved**: reuse existing mocks from `tests/server/setup/gas-mocks.ts` and `tests/server/helpers/`.
