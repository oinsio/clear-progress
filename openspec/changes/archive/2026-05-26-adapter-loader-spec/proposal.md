# Adapter Loader Spec

## Why

The adapter loading/creation functionality (selecting and instantiating the correct SyncAdapter based on connection config) is implemented in `packages/client/src/services/defaultServices.ts` but lacks formal specifications and BDD tests. The original `packages/adapter-loader` package is deprecated (D3 of add-supabase-ui) — adapter creation now uses a direct switch statement with per-type factory functions. Other related features (connection management, sync protocol, individual adapters) have dedicated openspec specs and BDD tests. Adapter loading is a gap in documentation coverage.

## What Changes

- **ADDED**: OpenSpec capability spec for adapter-loader (adapter creation via config type, lazy caching, error on missing config, fallback placeholder)
- **ADDED**: BDD feature files covering createSyncAdapter switch logic, getDefaultSyncAdapter caching, and defaultSyncAdapter IIFE fallback
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every adapter loading behavior has a formal specification in openspec
- G2: BDD feature files cover all adapter creation rules (type-based dispatch, caching, error handling, IIFE fallback)
- G3: Close the documentation gap between adapter loading and other sync-related features

## Non-Goals

- NG1: No changes to implementation code (defaultServices.ts)
- NG2: No E2E/Playwright tests (adapter loading is internal infrastructure)
- NG3: No tests for individual adapter internals (adapter-gas and adapter-supabase have their own specs)
- NG4: No resurrection of the deprecated adapter-loader package

## Users & Scenarios

- U1: Developer maintaining adapter switching logic — uses specs as reference for expected behavior
- U2: AI agent adding a new backend type — uses specs to understand the adapter creation pattern and constraints

## Requirements

### Functional

- FR1: Spec documents adapter creation based on connection config type (gas -> createGasAdapter, supabase -> createSupabaseAdapter)
- FR2: Spec documents error when no backend is configured (getConnectionConfig returns null)
- FR3: Spec documents lazy caching of adapter instance (getDefaultSyncAdapter creates once, returns cached)
- FR4: Spec documents IIFE fallback (defaultSyncAdapter returns null placeholder when no config at module load)
- FR5: Spec documents that GAS adapter receives url and getAccessToken function
- FR6: Spec documents that Supabase adapter receives SupabaseClient instance
- FR7: BDD scenarios cover adapter creation by config type
- FR8: BDD scenarios cover caching and error behavior

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/adapter_loader/adapter_creation.feature` — @adapter-loader-spec @FR1 @FR2 @FR5 @FR6
- `features/adapter_loader/adapter_caching.feature` — @adapter-loader-spec @FR3 @FR4

## Affected IA

No changes.

## Success Metrics

- M1: 100% of adapter loading behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: All BDD tests pass in <5s

## Open Questions

(none)

## Capabilities

### New Capabilities

- `adapter-loader`: Adapter creation and lifecycle — config-based type dispatch, per-type factory invocation, lazy singleton caching, IIFE fallback for module-scope initialization

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/adapter-loader/spec.md`
- New feature files: 2 files under `packages/client/src/test/features/adapter_loader/`
- New step definitions: corresponding `.steps.ts` files
- No changes to existing implementation code
