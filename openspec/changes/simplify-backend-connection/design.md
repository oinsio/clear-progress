## Context

The current backend connection UI lives on a standalone `/setup` page with collapsible accordion sections for GAS and Supabase. This page is a navigation dead-end (no sidebar, no right panel). The Settings page has a minimal "Sync" section that only shows status and links to `/setup`. This change consolidates everything into a single "Server" section on the Settings page.

Driven by: G1 (3-step connection), G2 (Supabase primary), G3 (show server info), G4 (no dead-end page) from proposal.

## Goals / Non-Goals

**Goals:**
- Inline connection flow in Settings with phase-based UI (selection → form → OAuth → connected)
- Reuse existing `connectionService` and adapter logic unchanged
- Update all test infrastructure to work without `/setup`

**Non-Goals:**
- Refactoring `connectionService.ts` or adapter interfaces
- Changing the sync protocol or auth providers
- Creating a wizard/stepper component — simple phase state is sufficient

## Decisions

### D1: Single ServerSection component with phase state machine

Replace the current accordion-based two-component approach with a single `ServerSection` component that manages phases via a state enum.

**Phases:** `selection` → `supabase_form` | `gas_form` → `connecting` → `supabase_providers` | `gas_awaiting_signin` → (connected state from `useConnectionStatus`)

**Alternative considered:** Separate route `/settings/connect` — rejected because it adds routing complexity and doesn't solve the dead-end problem, just moves it.

**Alternative considered:** Modal dialog for connection form — rejected because modals break mobile UX and can't show loading/error states as naturally.

### D2: Decompose into sub-components within `components/settings/`

```
components/settings/
  ServerSection.tsx          — orchestrator, phase state machine
  ServerBackendSelection.tsx — "Connect Supabase" / "Connect GAS" buttons
  ServerSupabaseForm.tsx     — URL + Anon Key form
  ServerGasForm.tsx          — URL + Client ID form
  ServerOAuthProviders.tsx   — OAuth provider buttons (Supabase)
  ServerGasSignIn.tsx        — "Sign in with Google" (GAS)
  ServerConnectedStatus.tsx  — connected state with URL, sync, disconnect
```

Each sub-component is stateless — all state lives in `ServerSection`. This keeps components under 200 lines and testable in isolation.

**Alternative considered:** Reuse existing `SupabaseSetupSection` / `GasSetupSection` — rejected because they are tightly coupled to the standalone page layout and accordion pattern.

### D3: Remove ROUTES.SETUP entirely

Delete the constant and route. No redirect from `/setup` to `/settings` — if someone has a stale bookmark, they get 404 (caught by the app's catch-all route which redirects to inbox).

**Alternative considered:** Keep `/setup` as redirect to `/settings` — rejected per user request to not maintain unused code.

### D4: GAS Client ID becomes required

Current flow allows GAS connection without Client ID, which leads to a confusing "not initialized" state. Making Client ID required simplifies the GAS phase machine: always `gas_form` → `connecting` → `gas_awaiting_signin` → connected.

The `not_initialized` phase (where backend needs `init()` after first sign-in) is kept — it's a valid state for fresh GAS deployments. But entry without Client ID is no longer possible.

### D5: OAuth redirect to /settings

`SupabaseAuthSync.tsx` and `handleOAuthSignIn` currently redirect to `/setup`. Change to `/settings`. The Settings page will handle `?code=` and `?error=` query params in a `useEffect`, same pattern as current SetupPage.

### D6: Anon Key as plain text input

Change `type="password"` to `type="text"` for the Supabase Anon Key field. The key is public (documented by Supabase), and masking it makes copy-paste harder and implies false security.

### D7: OAuth return detection for post-login redirect

After OAuth redirect back to `/settings`, the app must navigate to inbox. The naive approach — detecting any `null → non-null` token transition — caused false redirects for already-authenticated users visiting Settings, because Supabase always initializes `accessToken` as `null` and sets it asynchronously via `onAuthStateChange`.

**Solution:** Two-signal detection:
- **Implicit flow** (hash fragment `#access_token=...`): `supabaseClientManager.ts` boot code sets a `sessionStorage` flag (`oauth_return_pending`) when it detects OAuth tokens in the hash. SettingsPage reads this flag via `isOauthReturn()` and clears it via `clearOauthReturnFlag()` only upon successful redirect.
- **PKCE flow** (query param `?code=`): SettingsPage detects `?code=` in `location.search` and sets a local ref.

The redirect useEffect fires only when one of these signals is present AND `accessToken` becomes non-null.

**Why sessionStorage:** React StrictMode double-mounts components, so a consume-once in-memory flag gets consumed on the first mount and is lost for the second. `sessionStorage` survives remounts and is cleared explicitly.

**Alternative considered:** `useRef` initialized from a module-level consume-once function — rejected because StrictMode re-initializes refs on second mount, consuming the flag prematurely.

### D8: Cancel from OAuth/SignIn phase disconnects and returns to form

After successful connection check (Supabase or GAS), `connect()` has already been called and config is saved. If the user cannot authenticate (OAuth fails, no Google account, wrong provider), they are stuck — there's no way back.

**Decision:** Add a "Cancel" button to both `ServerOAuthProviders` and `ServerGasSignIn`. On cancel: call `disconnect()` to clear the saved config, then return to the corresponding form phase (`supabase_form` or `gas_form`) so the user can adjust inputs or cancel further to selection.

**Why disconnect:** Without disconnecting, the app would have a saved connection config pointing to a backend with no active session — a broken state.

**Why form (not selection):** The user already entered valid URL/key — returning to the form preserves their input and lets them retry or cancel to selection from there. Going straight to selection would lose their entered data.

**Alternative considered:** Return to selection directly — rejected because it forces the user to re-enter URL and key if they just want to retry authentication.

## Risks / Trade-offs

- [Risk] Settings page grows in complexity → Mitigation: decomposed into 7 small sub-components, each under 200 lines. ServerSection orchestrator delegates rendering.
- [Risk] Integration tests depend on `/setup` selectors → Mitigation: update `connection.spec.ts` and `auth.setup.ts` with new `data-testid` values in same change.
- [Risk] OAuth callback on `/settings` might conflict with existing Settings state → Mitigation: OAuth params are consumed and cleared in `useEffect` on mount, same proven pattern from SetupPage.
- [Trade-off] Losing dedicated onboarding page → Accepted: empty inbox with Settings access is simpler. First-time user hint can be a separate change (Q1 in proposal).
