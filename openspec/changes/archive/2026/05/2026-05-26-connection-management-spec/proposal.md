# Connection Management Spec

## Why

The connection management functionality (ConnectionService, useConnectionConfig, useConnectionStatus, useBackendConnected) is fully implemented but lacks formal specifications and BDD tests. Other domain features (settings, deleted entities, offline mode, sync) have dedicated openspec specs and feature files. Connection management is a gap in documentation coverage, making it harder to verify behavior correctness and detect regressions.

## What Changes

- **ADDED**: OpenSpec capability spec for connection management (connect, disconnect, config persistence, status derivation, backend type detection)
- **ADDED**: BDD feature files covering ConnectionService operations and connection status derivation
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every connection management behavior has a formal specification in openspec
- G2: BDD feature files cover all connection service domain rules (connect, disconnect, getConfig, getSavedConfig, getBackendType)
- G3: BDD feature files cover connection status derivation logic (priority rules, sync status mapping)
- G4: Close the documentation gap between connection management and other domain features

## Non-Goals

- NG1: No changes to implementation code (ConnectionService, hooks)
- NG2: No E2E/Playwright tests (connection UI testing is out of scope)
- NG3: No changes to existing offline_mode BDD tests (connection_status.feature already exists for FR4 of add-offline-mode-specs)
- NG4: No adapter-level connection tests (adapter-gas, adapter-supabase have their own specs)

## Users & Scenarios

- U1: Developer maintaining connection logic — uses specs as reference for expected behavior
- U2: AI agent implementing changes to connection switching — uses specs to understand constraints

## Requirements

### Functional

- FR1: Spec documents connect operation (saves config to localStorage with isActive: true, dispatches events)
- FR2: Spec documents disconnect operation (sets isActive: false, removes auth/sync keys, dispatches events)
- FR3: Spec documents getConnectionConfig (returns active config only, returns null for inactive/missing/invalid)
- FR4: Spec documents getSavedConnectionConfig (returns config regardless of isActive, returns null for missing/invalid)
- FR5: Spec documents getBackendType (derives backend type from active config)
- FR6: Spec documents useConnectionConfig hook (reactive updates via custom event and storage event)
- FR7: Spec documents useConnectionStatus hook (status derivation priority: not_configured > no_auth > sync status mapping)
- FR8: Spec documents useBackendConnected hook (deprecated, returns boolean based on config presence)
- FR9: Spec documents ConnectionConfig schema validation (discriminated union: gas with url/clientId/isActive, supabase with url/anonKey/isActive)
- FR10: BDD scenarios cover ConnectionService operations
- FR11: BDD scenarios cover connection status derivation

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/connection_management/connection_service_connect.feature` — @connection-management-spec @FR1
- `features/connection_management/connection_service_disconnect.feature` — @connection-management-spec @FR2
- `features/connection_management/connection_service_read.feature` — @connection-management-spec @FR3 @FR4 @FR5
- `features/connection_management/connection_status_derivation.feature` — @connection-management-spec @FR7

## Affected IA

No changes.

## Success Metrics

- M1: 100% of connection management behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: All BDD tests pass in <5s

## Open Questions

(none)

## Capabilities

### New Capabilities

- `connection-management`: Connection lifecycle management — connect, disconnect, config persistence in localStorage, config retrieval (active vs saved), backend type detection, connection status derivation, schema validation, reactive hooks

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/connection-management/spec.md`
- New feature files: 4 files under `packages/client/src/test/features/connection_management/`
- New step definitions: corresponding `.steps.ts` files
- No changes to existing implementation code
