## 1. Delete GAS packages (FR1, FR2)

- [x] 1.1 Delete `packages/adapter-gas/` directory entirely
- [x] 1.2 Delete `packages/adapter-loader/` directory entirely
- [x] 1.3 Remove `adapter-gas` and `adapter-loader` from root `package.json` build/typecheck scripts (FR14)
- [x] 1.4 Remove `pnpm-workspace.yaml` references if packages are listed there

## 2. Update contract types (FR6)

- [x] 2.1 Remove `GasConnectionConfigSchema` from `packages/contract/src/schemas/connection.ts`
- [x] 2.2 Update `BackendTypeSchema` — remove `"gas"` (keep as `z.enum(["supabase"])`)
- [x] 2.3 Update `ConnectionConfigSchema` — remove `GasConnectionConfigSchema` from discriminated union
- [x] 2.4 Update `ConnectionStoreSchema` — remove `"gas"` from `activeType` enum, remove `gas` from `configs`
- [x] 2.5 Remove `GasConnectionConfig` re-export from `packages/contract/src/schemas/index.ts` and `packages/contract/src/index.ts`
- [x] 2.6 Remove `GasConnectionConfig` re-export from `packages/client/src/types/connection.ts`

## 3. Update client services (FR4, FR5, FR8, FR10)

- [x] 3.1 Remove `createGasAdapter` import and `case "gas"` from `packages/client/src/services/defaultServices.ts`
- [x] 3.2 Remove GAS branches from `packages/client/src/services/connectionService.ts` (GAS clientId handling, `GOOGLE_CLIENT_ID_CHANGED_EVENT` dispatch)
- [x] 3.3 Remove GAS token persistence logic from `packages/client/src/services/tokenPersistence.ts` (if GAS-specific)
- [x] 3.4 Remove `GOOGLE_CLIENT_ID_CHANGED_EVENT` and `GOOGLE_USERINFO_URL` from constants (FR10)
- [x] 3.5 Remove `@clear-progress/adapter-gas` dependency from `packages/client/package.json`
- [x] 3.6 Remove `@react-oauth/google` dependency from `packages/client/package.json` (FR8)

## 4. Update AuthProvider (FR5, FR8)

- [x] 4.1 Remove `GoogleOAuthProvider` wrapper and import from `packages/client/src/app/providers/AuthProvider.tsx`
- [x] 4.2 Remove `GOOGLE_CLIENT_ID_CHANGED_EVENT` listener from `AuthProvider`
- [x] 4.3 Remove GAS-specific `configureTokenPersistence(localStoragePersistence)` call
- [x] 4.4 Delete `packages/client/src/app/providers/GoogleAuthSync.tsx`
- [x] 4.5 Delete `packages/client/src/app/providers/GoogleAuthSync.test.tsx`
- [x] 4.6 Delete `packages/client/src/test/mocks/googleOAuthMock.ts`

## 5. Update Settings UI (FR3, FR11)

- [x] 5.1 Remove GAS phases (`gas_form`, `gas_connecting`, `gas_awaiting_signin`) from `ServerSection.tsx`
- [x] 5.2 Remove `handleGasConnect()` and `handleGasInit()` from `ServerSection.tsx`
- [x] 5.3 Remove `onSelectGas` prop and GAS button from `ServerBackendSelection.tsx`
- [x] 5.4 Remove `isGasNeedsAuth` and GAS auth re-prompt block from `ServerConnectedStatus.tsx`
- [x] 5.5 Remove `GasIcon` SVG and `gas` mapping from `ProviderIcon.tsx`
- [x] 5.6 Delete `packages/client/src/components/settings/ServerGasForm.tsx`
- [x] 5.7 Delete `packages/client/src/components/settings/ServerGasSignIn.tsx`

## 6. Update hook (FR11)

- [x] 6.1 Remove GAS auth check branch from `packages/client/src/hooks/useConnectionStatus.ts`

## 7. Delete GAS utilities (FR7)

- [x] 7.1 Delete `packages/client/src/utils/gasUrl.ts`
- [x] 7.2 Delete `packages/client/src/utils/gasUrl.test.ts`
- [x] 7.3 Delete `packages/client/src/utils/clientId.ts` (verify it exists first)

## 8. Update i18n (FR9)

- [x] 8.1 Remove GAS-related keys from `packages/client/src/locales/ru.json`
- [x] 8.2 Remove GAS-related keys from `packages/client/src/locales/en.json`
- [x] 8.3 Remove GAS-related keys from `packages/client/src/locales/house.json`

## 9. Delete and update tests (FR17)

- [x] 9.1 Delete `packages/client/src/components/settings/ServerGasForm.test.tsx`
- [x] 9.2 Delete `packages/client/src/components/settings/ServerGasSignIn.test.tsx`
- [x] 9.3 Delete `packages/client/src/components/settings/ServerSection.gas.test.tsx`
- [x] 9.4 Delete `packages/client/src/test/features/gas_setup_ui/` directory (BDD)
- [x] 9.5 Delete `packages/client/src/test/features/adapter_loader/` directory (BDD)
- [x] 9.6 Delete `packages/client/src/test/features/server_connection/server_gas_form.feature` and its steps file
- [x] 9.7 Update `packages/client/src/test/features/server_connection/server_connection.feature` — remove GAS scenarios
- [x] 9.8 Update `packages/client/src/test/features/server_connection/steps/` — remove GAS mocks and step definitions
- [x] 9.9 Update `packages/client/src/test/features/connection_management/` features — remove GAS scenarios
- [x] 9.10 Update `packages/client/src/services/connectionService.test.ts` — remove GAS test cases
- [x] 9.11 Update `packages/client/src/services/defaultServices.test.ts` — remove GAS test cases
- [x] 9.12 Update `packages/client/src/hooks/useConnectionStatus.test.ts` — remove GAS test cases
- [x] 9.13 Update `packages/client/src/components/settings/ServerBackendSelection.test.tsx` — remove GAS button tests
- [x] 9.14 Update `packages/client/src/components/settings/ServerConnectedStatus.test.tsx` — remove GAS auth tests
- [x] 9.15 Update `packages/client/src/components/settings/ServerSection.connected.test.tsx` — remove GAS references
- [x] 9.16 Update `packages/client/src/components/settings/ServerSection.navigation.test.tsx` — remove GAS phase tests
- [x] 9.17 Update `packages/client/src/components/settings/ProviderIcon.test.tsx` — remove GAS icon test
- [x] 9.18 Update AuthProvider tests (`AuthProvider.test.tsx`, `.core.test.tsx`, `.session.test.tsx`) — remove GAS scenarios
- [x] 9.19 Update `packages/client/src/test/features/server_connection/steps/serverSectionMocks.ts` — remove GAS mocks
- [x] 9.20 Update `packages/client/src/app/providers/AuthProvider.test-helpers.tsx` — remove GAS helpers
- [x] 9.21 Update `packages/client/src/app/providers/SyncProvider.test-helpers.tsx` — remove GAS references if any

## 10. Delete documentation (FR12, FR13)

- [x] 10.1 Delete `docs/api/openapi.yaml`
- [x] 10.2 Update `docs/architecture/connection-config.md` — remove GAS sections
- [x] 10.3 Update `docs/contributing/how-to-add-adapter.md` — remove GAS references if any

## 11. Update OpenSpec (FR15, FR16)

- [x] 11.1 Delete `openspec/specs/gas-adapter/` directory
- [x] 11.2 Delete `openspec/specs/gas-server/` directory
- [x] 11.3 Delete `openspec/specs/gas-sheets-schema/` directory
- [x] 11.4 Delete `openspec/specs/gas-setup-ui/` directory
- [x] 11.5 Delete `openspec/specs/adapter-loader/` directory
- [x] 11.6 Update `openspec/config.yaml` — remove GAS and adapter-loader from context

## 12. Verification (M1-M5, NFR-P1)

- [x] 12.1 Run `pnpm build` — verify success (M2)
- [x] 12.2 Run `pnpm test` — verify all tests pass (M3)
- [x] 12.3 Run grep verification: no GAS references in source code (M1)
- [x] 12.4 Verify `packages/adapter-gas/` and `packages/adapter-loader/` do not exist (M5)
- [x] 12.5 Verify `@react-oauth/google` not in any `package.json` (M4)
- [x] 12.6 Run `pnpm install` to update lockfiles after dependency removal
