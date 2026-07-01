## 1. OpenSpec Stable Spec

- [x] 1.1 Create `openspec/specs/connection-management/spec.md` — connection management capability (connect, disconnect, config retrieval, backend type, schema validation, status derivation) — implements FR1, FR2, FR3, FR4, FR5, FR7, FR9

## 2. BDD Feature Files — ConnectionService Connect

- [x] 2.1 Create `features/connection_management/connection_service_connect.feature` — scenarios for connect saving config, overwriting isActive, dispatching events — @connection-management-spec @FR1 @FR10

## 3. BDD Step Definitions — ConnectionService Connect

- [x] 3.1 Create `features/connection_management/steps/connection_service_connect.steps.ts` — step definitions using localStorage for ConnectionService connect operations

## 4. BDD Feature Files — ConnectionService Disconnect

- [x] 4.1 Create `features/connection_management/connection_service_disconnect.feature` — scenarios for disconnect deactivation, key removal, graceful handling, event dispatch — @connection-management-spec @FR2 @FR10

## 5. BDD Step Definitions — ConnectionService Disconnect

- [x] 5.1 Create `features/connection_management/steps/connection_service_disconnect.steps.ts` — step definitions for disconnect operations

## 6. BDD Feature Files — ConnectionService Read

- [x] 6.1 Create `features/connection_management/connection_service_read.feature` — scenarios for getConnectionConfig, getSavedConnectionConfig, getBackendType — @connection-management-spec @FR3 @FR4 @FR5 @FR10

## 7. BDD Step Definitions — ConnectionService Read

- [x] 7.1 Create `features/connection_management/steps/connection_service_read.steps.ts` — step definitions for config read operations

## 8. BDD Feature Files — Connection Status Derivation

- [x] 8.1 Create `features/connection_management/connection_status_derivation.feature` — scenarios for status priority rules, sync status mapping — @connection-management-spec @FR7 @FR11

## 9. BDD Step Definitions — Connection Status Derivation

- [x] 9.1 Create `features/connection_management/steps/connection_status_derivation.steps.ts` — step definitions using mocked hooks for useConnectionStatus

## 10. Verification

- [x] 10.1 Run all BDD tests and verify they pass
- [x] 10.2 Verify build: `pnpm run build`
