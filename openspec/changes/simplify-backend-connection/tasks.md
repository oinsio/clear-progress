## 1. Infrastructure: Remove /setup route and constants

- [ ] 1.1 Remove `ROUTES.SETUP` from `constants/index.ts` and update `constants/index.routes.test.ts` — FR11
- [ ] 1.2 Remove `/setup` route from `router.tsx` and `SetupPage` lazy import — FR11
- [ ] 1.3 Remove redirect to `/setup` in `main.tsx` — FR12
- [ ] 1.4 Change OAuth `redirectTo` in `SupabaseAuthSync.tsx` from `/setup` to `/settings` — FR14
- [ ] 1.5 Change OAuth `redirectTo` in `SupabaseSetupSection.tsx` (will be replaced, but update now for build integrity) — FR14
- [ ] 1.6 Update `RightFilterPanel.tsx`: text to "Configure server", navigate to `/settings` instead of `/setup` — FR13
- [ ] 1.7 Verify build passes: `pnpm run build`

## 2. i18n: Add new keys, keep old keys until cleanup

- [ ] 2.1 Add new i18n keys for Server section to `ru.json` and `en.json`: `settings.server.*` (section title, statuses, buttons, form labels, errors) — FR1-FR10
- [ ] 2.2 Add i18n key for "Configure server" right panel button — FR13

## 3. Server Section components (TDD)

- [ ] 3.1 BDD feature: `server_connection.feature` — backend selection scenarios (Supabase first, GAS second, cancel returns to selection) — FR2, FR3, FR4, FR5, UX1
- [ ] 3.2 BDD feature: `server_supabase_form.feature` — Supabase form validation, connect, providers, errors — FR3, FR6, FR8, UX3, UX4
- [ ] 3.3 BDD feature: `server_gas_form.feature` — GAS form validation (both fields required), connect, sign-in, init — FR4, FR7, FR9, FR15, UX3, UX4
- [ ] 3.4 BDD feature: `server_connected.feature` — connected state shows type+URL, full sync, disconnect — FR1, FR10, UX2, UX5, UX6
- [ ] 3.5 Implement `ServerBackendSelection.tsx` — two buttons, Supabase primary — FR2, UX1
- [ ] 3.6 Implement `ServerSupabaseForm.tsx` — URL + Anon Key (type="text"), connect + cancel — FR3, FR6
- [ ] 3.7 Implement `ServerGasForm.tsx` — URL + Client ID (both required), connect + cancel — FR4, FR7, FR15
- [ ] 3.8 Implement `ServerOAuthProviders.tsx` — OAuth provider buttons for Supabase — FR8
- [ ] 3.9 Implement `ServerGasSignIn.tsx` — "Sign in with Google" button + init flow — FR9, FR15
- [ ] 3.10 Implement `ServerConnectedStatus.tsx` — type label, URL, full sync, disconnect — FR1, FR10, UX2
- [ ] 3.11 Implement `ServerSection.tsx` — orchestrator with phase state machine — FR1-FR10
- [ ] 3.12 Step definitions for all BDD features (3.1-3.4)
- [ ] 3.13 Verify all BDD unit tests pass: `npx vitest run`

## 4. Settings page integration

- [ ] 4.1 Replace "Sync" section in `SettingsPage.tsx` with `ServerSection` component — FR1, FR10
- [ ] 4.2 Add OAuth callback handling (`?code=`, `?error=`) to SettingsPage — FR14
- [ ] 4.3 Verify build passes: `pnpm run build`
- [ ] 4.4 Run full unit test suite: `npx vitest run`

## 5. Cleanup: Remove old setup page files

- [ ] 5.1 Delete `SetupPage.tsx`, `SetupPage.test.tsx`
- [ ] 5.2 Delete `GasSetupSection.tsx`, `GasConnectedSection.tsx`
- [ ] 5.3 Delete `SupabaseSetupSection.tsx`, `SupabaseConnectedSection.tsx`
- [ ] 5.4 Remove old `setup.*` i18n keys from `ru.json` and `en.json`
- [ ] 5.5 Remove `setupPageTestHelpers.tsx` from test helpers
- [ ] 5.6 Verify no imports reference deleted files: grep for old imports
- [ ] 5.7 Verify build passes: `pnpm run build`

## 6. BDD tests: Update existing features

- [ ] 6.1 Rewrite `supabase_setup_connection.feature` → scenarios on Settings page with new selectors — FR3, FR6, FR8
- [ ] 6.2 Rewrite `gas_setup_connection.feature` → scenarios on Settings page with new selectors — FR4, FR7, FR9, FR15
- [ ] 6.3 Rewrite `gas_setup_connected.feature` → connected state in Settings — FR10
- [ ] 6.4 Update step definitions for rewritten features (6.1-6.3)
- [ ] 6.5 Verify `gas_setup_url_parsing.feature` still passes (no changes needed)
- [ ] 6.6 Run all BDD unit tests: `npx vitest run`

## 7. E2E BDD tests

- [ ] 7.1 Rewrite `supabase_setup_e2e.feature` → E2E flow via `/settings` — FR3, FR8, FR14
- [ ] 7.2 Rewrite `supabase_setup_nfr_e2e.feature` → accessibility and responsive on Settings page — NFR-A1, NFR-A2, NFR-A3, NFR-R1
- [ ] 7.3 Update E2E step definitions for rewritten features (7.1-7.2)

## 8. Integration tests: Update for /settings

- [ ] 8.1 Update `connection.spec.ts`: navigate to `/settings`, click "Connect Supabase", use new `data-testid` selectors — FR3, FR6
- [ ] 8.2 Update `auth.setup.ts`: full auth flow via `/settings` instead of `/setup` — FR14
- [ ] 8.3 Run integration tests to verify (requires Docker): `pnpm --filter integration test`

## 9. Mutation testing and final verification

- [ ] 9.1 Run mutation testing on new Server section components — target >= 95%, minimum >= 90% — M4
- [ ] 9.2 Add tests to kill survived mutants if score < 95%
- [ ] 9.3 Final build verification: `pnpm run build`
- [ ] 9.4 Final full test suite: `npx vitest run`
- [ ] 9.5 Verify M2: grep confirms zero references to `ROUTES.SETUP` or `/setup` path in source code
