## 1. Infrastructure: Remove /setup route and constants

- [x] 1.1 Remove `ROUTES.SETUP` from `constants/index.ts` and update `constants/index.routes.test.ts` — FR11
- [x] 1.2 Remove `/setup` route from `router.tsx` and `SetupPage` lazy import — FR11
- [x] 1.3 Remove redirect to `/setup` in `main.tsx` — FR12
- [x] 1.4 Change OAuth `redirectTo` in `SupabaseAuthSync.tsx` from `/setup` to `/settings` — FR14
- [x] 1.5 Change OAuth `redirectTo` in `SupabaseSetupSection.tsx` (will be replaced, but update now for build integrity) — FR14
- [x] 1.6 Update `RightFilterPanel.tsx`: text to "Configure server", navigate to `/settings` instead of `/setup` — FR13
- [x] 1.7 Verify build passes: `pnpm run build`

## 2. i18n: Add new keys, keep old keys until cleanup

- [x] 2.1 Add new i18n keys for Server section to `ru.json` and `en.json`: `settings.server.*` (section title, statuses, buttons, form labels, errors) — FR1-FR10
- [x] 2.2 Add i18n key for "Configure server" right panel button — FR13

## 3. Server Section components (TDD)

- [x] 3.1 BDD feature: `server_connection.feature` — backend selection scenarios (Supabase first, GAS second, cancel returns to selection) — FR2, FR3, FR4, FR5, UX1
- [x] 3.2 BDD feature: `server_supabase_form.feature` — Supabase form validation, connect, providers, errors — FR3, FR6, FR8, UX3, UX4
- [x] 3.3 BDD feature: `server_gas_form.feature` — GAS form validation (both fields required), connect, sign-in, init — FR4, FR7, FR9, FR15, UX3, UX4
- [x] 3.4 BDD feature: `server_connected.feature` — connected state shows type+URL, full sync, disconnect — FR1, FR10, UX2, UX5, UX6
- [x] 3.5 Implement `ServerBackendSelection.tsx` — two buttons, Supabase primary — FR2, UX1
- [x] 3.6 Implement `ServerSupabaseForm.tsx` — URL + Anon Key (type="text"), connect + cancel — FR3, FR6
- [x] 3.7 Implement `ServerGasForm.tsx` — URL + Client ID (both required), connect + cancel — FR4, FR7, FR15
- [x] 3.8 Implement `ServerOAuthProviders.tsx` — OAuth provider buttons for Supabase — FR8
- [x] 3.9 Implement `ServerGasSignIn.tsx` — "Sign in with Google" button + init flow — FR9, FR15
- [x] 3.10 Implement `ServerConnectedStatus.tsx` — type label, URL, full sync, disconnect — FR1, FR10, UX2
- [x] 3.11 Implement `ServerSection.tsx` — orchestrator with phase state machine — FR1-FR10
- [x] 3.12 Step definitions for all BDD features (3.1-3.4)
- [x] 3.13 Verify all BDD unit tests pass: `npx vitest run`

## 4. Settings page integration

- [x] 4.1 Replace "Sync" section in `SettingsPage.tsx` with `ServerSection` component — FR1, FR10
- [x] 4.2 Add OAuth callback handling (`?code=`, `?error=`) to SettingsPage — FR14
- [x] 4.3 Verify build passes: `pnpm run build`
- [x] 4.4 Run full unit test suite: `npx vitest run`

## 5. Cleanup: Remove old setup page files

- [x] 5.1 Delete `SetupPage.tsx`, `SetupPage.test.tsx`
- [x] 5.2 Delete `GasSetupSection.tsx`, `GasConnectedSection.tsx`
- [x] 5.3 Delete `SupabaseSetupSection.tsx`, `SupabaseConnectedSection.tsx`
- [x] 5.4 Remove old `setup.*` i18n keys from `ru.json` and `en.json`
- [x] 5.5 Remove `setupPageTestHelpers.tsx` from test helpers
- [x] 5.6 Verify no imports reference deleted files: grep for old imports
- [x] 5.7 Verify build passes: `pnpm run build`

## 6. BDD tests: Update existing features

- [x] 6.1 Rewrite `supabase_setup_connection.feature` → scenarios on Settings page with new selectors — FR3, FR6, FR8
- [x] 6.2 Rewrite `gas_setup_connection.feature` → scenarios on Settings page with new selectors — FR4, FR7, FR9, FR15
- [x] 6.3 Rewrite `gas_setup_connected.feature` → connected state in Settings — FR10
- [x] 6.4 Update step definitions for rewritten features (6.1-6.3)
- [x] 6.5 Verify `gas_setup_url_parsing.feature` still passes (no changes needed)
- [x] 6.6 Run all BDD unit tests: `npx vitest run`

## 7. E2E BDD tests

- [x] 7.1 Rewrite `supabase_setup_e2e.feature` → E2E flow via `/settings` — FR3, FR8, FR14
- [x] 7.2 Rewrite `supabase_setup_nfr_e2e.feature` → accessibility and responsive on Settings page — NFR-A1, NFR-A2, NFR-A3, NFR-R1
- [x] 7.3 Update E2E step definitions for rewritten features (7.1-7.2)

## 8. Integration tests: Update for /settings

- [x] 8.1 Update `connection.spec.ts`: navigate to `/settings`, click "Connect Supabase", use new `data-testid` selectors — FR3, FR6
- [x] 8.2 Update `auth.setup.ts`: full auth flow via `/settings` instead of `/setup` — FR14
- [x] 8.3 Run integration tests to verify (requires Docker): `pnpm --filter integration test`

## 9. FR16: Cancel button on OAuth/SignIn phases

- [x] 9.1 BDD feature: cancel from OAuth providers returns to Supabase form (disconnect + form) — FR16
- [x] 9.2 BDD feature: cancel from GAS sign-in returns to GAS form (disconnect + form) — FR16
- [x] 9.3 Add `onCancel` prop to `ServerOAuthProviders.tsx` — render Cancel button — FR16
- [x] 9.4 Add `onCancel` prop to `ServerGasSignIn.tsx` — render Cancel button — FR16
- [x] 9.5 Add cancel handlers in `ServerSection.tsx` for `supabase_providers` and `gas_awaiting_signin` phases — disconnect + return to form — FR16
- [x] 9.6 Step definitions for new BDD scenarios (9.1-9.2) — FR16
- [x] 9.7 Add i18n key for Cancel button if needed — FR16 (already exists: settings.server.cancel)
- [x] 9.8 Verify all tests pass: `npx vitest run`
- [x] 9.9 Verify build passes: `pnpm run build`

## 10. Mutation testing and final verification

- [ ] 10.1 Run mutation testing on new Server section components — target >= 95%, minimum >= 90% — M4
- [ ] 10.2 Add tests to kill survived mutants if score < 95%
- [x] 10.3 Final build verification: `pnpm run build`
- [x] 10.4 Final full test suite: `npx vitest run`
- [x] 10.5 Verify M2: grep confirms zero references to `ROUTES.SETUP` or `/setup` path in source code

## 11. UX polish: config persistence, placeholders, hints, account info

- [x] 11.1 Add `SAVED_SUPABASE_CONFIG` and `SAVED_GAS_CONFIG` storage keys — FR17
- [x] 11.2 Update `connect()` to persist type-specific config alongside main config — FR17
- [x] 11.3 Add `getSavedConfigForType(type)` to connectionService — FR17
- [x] 11.4 Update `ServerSupabaseForm` and `ServerGasForm` to read from type-specific saved config — FR17
- [x] 11.5 Add placeholder attributes to all form inputs (URL, Anon Key, Client ID) — FR18
- [x] 11.6 Add helper description text below each form input — FR19
- [x] 11.7 Add i18n keys for placeholders, descriptions, hints, and account label — FR18, FR19, FR20
- [x] 11.8 Add explanatory text above backend selection buttons — FR20
- [x] 11.9 Equalize button styles in ServerBackendSelection (remove accent from Supabase) — FR20
- [x] 11.10 Show user email in ServerConnectedStatus — FR10
- [x] 11.11 Update serverSectionMocks.ts to export `getSavedConfigForType` mock
- [x] 11.12 Verify build passes: `pnpm run build`
- [x] 11.13 Verify server_connection tests pass: `npx vitest run`

## 12. Bugfixes: connecting phase and OAuth hint

- [x] 12.1 Split shared `"connecting"` phase into `"supabase_connecting"` and `"gas_connecting"` so GAS form stays visible during GAS connection check — FR21
- [x] 12.2 Fix BDD test `server_gas_form.steps.tsx` "Connecting state disables form" to assert GAS testids instead of Supabase — FR21
- [x] 12.3 Add hint text above OAuth provider buttons in `ServerOAuthProviders.tsx` — FR22
- [x] 12.4 Add i18n keys `chooseAuthMethod` to `en.json` and `ru.json` — FR22
- [x] 12.5 Verify build passes: `pnpm run build`
- [x] 12.6 Verify server_connection BDD tests pass: `npx vitest run`
