# gas-remove

## Why

Google Apps Script (GAS) was the original backend for Clear Progress, using Google Sheets as a database. After testing it in production, GAS proved to be a poor fit: response times are slow (2-5s per request), Google OAuth setup is complex for end users, and the Sheets-as-DB model creates maintenance overhead. Supabase has fully replaced GAS as the backend. The GAS code is now dead weight — increasing build times, adding unnecessary dependencies, and cluttering the codebase. Removing it simplifies the architecture and reduces the maintenance surface.

## What Changes

### REMOVED

- **`packages/adapter-gas`** — entire Google Apps Script adapter package (client + server)
- **`packages/adapter-loader`** — deprecated adapter loading package (only contained deprecation notice)
- **GAS UI components** — `ServerGasForm`, `ServerGasSignIn`, `GoogleAuthSync`, `GasIcon`
- **GAS utilities** — `gasUrl.ts`, `clientId.ts`
- **GAS branches in services** — `case "gas"` in `defaultServices`, `connectionService`, `AuthProvider`
- **`@react-oauth/google` dependency** — used exclusively for GAS OAuth flow
- **GAS documentation** — `docs/api/openapi.yaml`, GAS-specific sections in `docs/architecture/connection-config.md`
- **GAS i18n keys** — all `settings.server.*gas*` translation keys
- **GAS constants** — `GOOGLE_CLIENT_ID_CHANGED_EVENT`, `GOOGLE_USERINFO_URL`

### MODIFIED

- **`contract/schemas/connection.ts`** — remove `GasConnectionConfigSchema`, remove `"gas"` from `BackendTypeSchema` and `ConnectionStoreSchema` (keep union type structure for extensibility)
- **Settings UI** — `ServerSection`, `ServerBackendSelection`, `ServerConnectedStatus`, `ProviderIcon` — remove GAS-specific phases, buttons, icons, auth blocks
- **`useConnectionStatus` hook** — remove GAS auth check branch
- **`openspec/config.yaml`** — remove GAS and adapter-loader from project context
- **Root `package.json`** — remove `adapter-gas` and `adapter-loader` from build/typecheck scripts

## Goals

- **G1**: Zero GAS-related code, tests, or documentation remains in the project (except immutable archived changes)
- **G2**: Build and all tests pass after removal
- **G3**: Reduced dependency count (remove `@react-oauth/google`, `@types/google-apps-script`)

## Non-Goals

- **NG1**: Refactoring the remaining Supabase connection flow — keep as-is
- **NG2**: Simplifying `BackendType` to a single literal — keep union structure for future extensibility
- **NG3**: Simplifying `ConnectionStore` structure — keep current format
- **NG4**: Modifying archived OpenSpec changes — they are immutable per process rules

## Users & Scenarios

- **U1**: Developer — no longer encounters GAS code when navigating the codebase, builds are faster
- **U2**: End user — sees only Supabase as backend option in settings (no change in current behavior since GAS was already unused)

## Requirements

### Functional

- **FR1**: Delete `packages/adapter-gas` entirely
- **FR2**: Delete `packages/adapter-loader` entirely
- **FR3**: Remove all GAS-specific UI components (`ServerGasForm`, `ServerGasSignIn`, `GoogleAuthSync`, `GasIcon`)
- **FR4**: Remove GAS branches from services (`defaultServices`, `connectionService`, `tokenPersistence`)
- **FR5**: Remove GAS branches from `AuthProvider` (GoogleOAuthProvider wrapper, client ID event listener)
- **FR6**: Remove GAS from `contract/schemas/connection.ts` (GasConnectionConfigSchema, gas entries in unions)
- **FR7**: Remove GAS utilities (`gasUrl.ts`, `clientId.ts`)
- **FR8**: Remove `@react-oauth/google` dependency and its mock (`googleOAuthMock.ts`)
- **FR9**: Remove GAS i18n keys from `ru.json`, `en.json`, `house.json`
- **FR10**: Remove GAS constants (`GOOGLE_CLIENT_ID_CHANGED_EVENT`, `GOOGLE_USERINFO_URL`)
- **FR11**: Remove GAS hook logic from `useConnectionStatus`
- **FR12**: Delete GAS documentation (`docs/api/openapi.yaml`)
- **FR13**: Update `docs/architecture/connection-config.md` — remove GAS sections
- **FR14**: Update root `package.json` build/typecheck scripts — remove adapter-gas and adapter-loader
- **FR15**: Remove GAS OpenSpec specs from `openspec/specs/` (gas-adapter, gas-server, gas-sheets-schema, gas-setup-ui, adapter-loader)
- **FR16**: Update `openspec/config.yaml` — remove GAS and adapter-loader from context
- **FR17**: Delete all GAS-specific tests and BDD features

### Non-Functional

#### Performance

- **NFR-P1**: Build time should decrease (fewer packages to compile)

## UX Acceptance Criteria

- **UX1**: Settings page shows only Supabase backend option — no empty space or broken layout where GAS option was
- **UX2**: Server connection flow works end-to-end with Supabase after removal

## Behavior

GAS-specific BDD features will be deleted. Remaining features (server_connection, connection_management) will be updated to remove GAS scenarios.

## Visual Reference

No visual changes needed beyond removing GAS option from settings.

## Affected IA

No IA changes — GAS was not part of the information architecture.

## Success Metrics

- **M1**: `grep -ri "gas" packages/` returns zero results in source code (excluding node_modules, dist, coverage)
- **M2**: `pnpm build` succeeds
- **M3**: `pnpm test` passes with zero failures
- **M4**: `@react-oauth/google` not present in any `package.json`
- **M5**: `packages/adapter-gas/` and `packages/adapter-loader/` directories do not exist

## Open Questions

None — all decisions made during exploration.
