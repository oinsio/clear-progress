## 1. Setup — vitest-cucumber in adapter-gas

- [x] 1.1 Add `@amiceli/vitest-cucumber` as devDependency to `packages/adapter-gas` (FR12-FR14)
- [x] 1.2 Create `packages/adapter-gas/src/test/features/` directory structure with subdirs: `gas_adapter/`, `gas_server/`, `gas_sheets/`
- [x] 1.3 Verify vitest-cucumber works with a trivial smoke test in adapter-gas, then remove it

## 2. BDD — GAS Client Adapter (gas-adapter spec)

- [x] 2.1 Write `gas_adapter/gas_adapter_transport.feature` — ping via GET, POST format, action names, Content-Type (FR1, FR2)
- [x] 2.2 Write step definitions for `gas_adapter_transport` — reuse fetch mock pattern
- [x] 2.3 Write `gas_adapter/gas_adapter_auth.feature` — null token throws ApiAuthError, UNAUTHORIZED in response body (FR1, FR3)
- [x] 2.4 Write step definitions for `gas_adapter_auth`
- [x] 2.5 Write `gas_adapter/gas_adapter_validation.feature` — Zod validation, ApiValidationError on invalid shape (FR3)
- [x] 2.6 Write step definitions for `gas_adapter_validation`
- [x] 2.7 Write `gas_adapter/gas_adapter_timeout.feature` — 30s timeout via AbortController (FR4)
- [x] 2.8 Write step definitions for `gas_adapter_timeout`
- [x] 2.9 Run all gas_adapter BDD tests, verify green

## 3. BDD — GAS Server (gas-server spec)

- [x] 3.1 Write `gas_server/gas_server_routing.feature` — doGet ping, doPost action dispatch, unknown actions (FR5)
- [x] 3.2 Write step definitions for `gas_server_routing` — reuse existing GAS mocks from `tests/server/setup/gas-mocks.ts`
- [x] 3.3 Write `gas_server/gas_server_auth.feature` — token verification, owner registration, wrong account, failure reasons (FR6)
- [x] 3.4 Write step definitions for `gas_server_auth` — reuse `auth-test-utils.ts`
- [x] 3.5 Write `gas_server/gas_server_errors.feature` — error response format, error codes (FR7)
- [x] 3.6 Write step definitions for `gas_server_errors`
- [x] 3.7 Run all gas_server BDD tests, verify green

## 4. BDD — Google Sheets Schema (gas-sheets-schema spec)

- [x] 4.1 Write `gas_sheets/sheets_coercion.feature` — boolean, timestamp, date-only, box, goal status coercion (FR9)
- [x] 4.2 Write step definitions for `sheets_coercion` — test pure functions directly
- [x] 4.3 Write `gas_sheets/sheets_crud.feature` — getAllRecords, upsertRecord, upsertRecords, deleteRecordsByIds (FR10)
- [x] 4.4 Write step definitions for `sheets_crud` — reuse `base-test-utils.ts` sheet mock
- [x] 4.5 Write `gas_sheets/sheets_meta.feature` — Meta sheet init, read/save revision, idempotent init (FR11)
- [x] 4.6 Write step definitions for `sheets_meta`
- [x] 4.7 Write `gas_sheets/sheets_structure.feature` — sheet names, column headers, init creates all sheets (FR8)
- [x] 4.8 Write step definitions for `sheets_structure`
- [x] 4.9 Run all gas_sheets BDD tests, verify green

## 5. Verification

- [x] 5.1 Run full `packages/adapter-gas` test suite (`pnpm run test`), verify all tests pass
- [x] 5.2 Run `pnpm run build` from project root, verify no build errors
- [x] 5.3 Ask user to run mutation tests (`pnpm run test:mutation` in `packages/adapter-gas`) — target >= 90% on new step files
