## 1. Setup

- [x] 1.1 Install `@supabase/supabase-js` in `packages/client` — FR11
- [x] 1.2 Add Supabase-related constants: `SUPABASE_URL_SUFFIX`, `SUPABASE_SETTINGS_ENDPOINT`, `SUPABASE_SETTINGS_TIMEOUT_MS` — FR3, FR4, NFR-P1

## 2. URL Parsing Utility (RED → GREEN → REFACTOR)

- [x] 2.1 RED: Write failing tests for `parseSupabaseInput()`: plain ID → full URL, full URL passthrough, whitespace trimming — FR3
- [x] 2.2 GREEN: Implement `parseSupabaseInput()` to make tests pass — FR3
- [x] 2.3 VERIFY: Mutation testing on `parseSupabaseInput()` — target >=95% — M3

## 3. Adapter Factory Refactoring (RED → GREEN → REFACTOR)

- [x] 3.1 RED: Write tests for `createGasAdapter(url, getAccessToken)` returning `GasSyncAdapter` — FR9
- [x] 3.2 GREEN: Export `createGasAdapter` from `packages/adapter-gas` — FR9
- [x] 3.3 RED: Write tests for `createSupabaseAdapter(supabaseClient)` returning `SupabaseSyncAdapter` — FR9
- [x] 3.4 GREEN: Export `createSupabaseAdapter` from `packages/adapter-supabase` — FR9
- [x] 3.5 GREEN: Refactor `defaultServices.ts` to switch-based creation with per-type factories — FR9, D3
- [x] 3.6 REFACTOR: Remove `adapterRegistry.ts` from contract, remove/repurpose `adapter-loader` — FR9
- [x] 3.7 VERIFY: All existing tests pass — M2

## 4. SupabaseSyncAdapter Refactoring (RED → GREEN → REFACTOR)

- [x] 4.1 RED: Write tests for `SupabaseSyncAdapter(supabaseClient)` using `functions.invoke()` — FR8
- [x] 4.2 RED: Write test for auth error handling (401 → `ApiAuthError`) — FR8
- [x] 4.3 RED: Write test for ping without active session — supabase-adapter spec
- [x] 4.4 GREEN: Refactor `SupabaseSyncAdapter` to accept `SupabaseClient` and use `functions.invoke()` — FR8
- [x] 4.5 VERIFY: Contract tests pass against refactored adapter — M2
- [x] 4.6 VERIFY: Mutation testing on adapter — target >=95% — M3

## 5. Supabase Connection Service (RED → GREEN → REFACTOR)

- [x] 5.1 RED: Write tests for `fetchSupabaseProviders(url, anonKey)`: success with providers, no providers, timeout, network error — FR4, FR5, NFR-P1
- [x] 5.2 GREEN: Implement `fetchSupabaseProviders()` — FR4, FR5, D5
- [x] 5.3 RED: Write tests for Supabase client instance management (create/get/destroy) — FR11, D2
- [x] 5.4 GREEN: Implement Supabase client singleton — FR11, D2
- [x] 5.5 VERIFY: Mutation testing on connection service — target >=95% — M3

## 6. Supabase Auth Integration (RED → GREEN → REFACTOR)

- [x] 6.1 RED: Write tests for `SupabaseAuthSync`: SIGNED_IN → onTokenUpdate, SIGNED_OUT → onClear, TOKEN_REFRESHED → onTokenUpdate — supabase-auth spec
- [x] 6.2 GREEN: Implement `SupabaseAuthSync` renderless component — FR10, D6
- [x] 6.3 RED: Write tests for `AuthProvider` backend type detection: gas → GoogleAuthSync, supabase → SupabaseAuthSync, none → no-ops — FR10
- [x] 6.4 GREEN: Modify `AuthProvider` to conditionally render auth mechanism — FR10, D6
- [x] 6.5 VERIFY: Mutation testing on auth components — target >=95% — M3

## 7. SetupPage UI — BDD Specs First, Then Implementation

- [x] 7.1 RED: Write Gherkin feature file for Supabase setup flow — @add-supabase-ui @FR1 @FR2 @FR4 @FR5 @FR6 @FR7 @FR13 @FR14
- [x] 7.2 RED: Write BDD unit step definitions (vitest-cucumber) — all steps fail (no implementation) — FR1, FR2, FR4, FR5, FR6
- [x] 7.3 RED: Write BDD E2E feature file for full Supabase connection flow (playwright-bdd) — FR6, FR7, UX5
- [x] 7.4 RED: Write BDD E2E step definitions — all steps fail — FR6, FR7
- [x] 7.5 REFACTOR: Extract existing GAS form into `GasSetupSection` component (no behavior change, existing tests stay green) — D7
- [x] 7.6 GREEN: Implement `SupabaseSetupSection` — URL + Anon Key inputs, Connect button — FR1, FR2, UX2, UX3
- [x] 7.7 GREEN: Implement provider loading and OAuth button display — FR5, FR6, FR13, UX4
- [x] 7.8 GREEN: Implement connected state for Supabase — URL display, re-auth buttons — FR14
- [x] 7.9 GREEN: Implement OAuth callback handling on SetupPage (detect code, wait for session, navigate) — FR7, D4
- [x] 7.10 GREEN: Implement error and loading states — UX6, UX7
- [x] 7.11 GREEN: Add i18n keys for all Supabase UI strings to `ru.json` and `en.json` — CLAUDE.md i18n rule
- [x] 7.12 VERIFY: All BDD unit tests pass (step definitions green)
- [x] 7.13 VERIFY: All BDD E2E tests pass

## 8. Accessibility and Responsive (RED → GREEN)

- [x] 8.1 RED: Write BDD E2E scenarios for keyboard navigation of Supabase setup form — NFR-A1
- [x] 8.2 RED: Write axe-core assertion tests for SetupPage — NFR-A2, NFR-A3
- [x] 8.3 RED: Write BDD E2E scenarios for responsive layout (320px, 768px, 1440px) — NFR-R1
- [x] 8.4 GREEN: Add aria-live regions, accessible names, keyboard support to make a11y tests pass — NFR-A1, NFR-A2, NFR-A3
- [x] 8.5 GREEN: Fix responsive issues to make viewport tests pass — NFR-R1

## 9. Final Verification

- [x] 9.1 VERIFY: Full GAS connection flow E2E still works — M2
- [x] 9.2 VERIFY: `pnpm run build` succeeds with no errors
- [ ] 9.3 VERIFY: Mutation testing across all new code — target >=95%, minimum >=90% — M3
