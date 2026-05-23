# add-supabase-ui

## Why

The Supabase backend adapter is implemented (`adapter-supabase`), but there is no UI for users to connect to it. Currently, SetupPage only supports Google Apps Script backend. Users who deploy their own Supabase instance have no way to configure the connection from within the app.

## What Changes

- **ADDED**: Supabase connection form on SetupPage (Project URL/ID + Anon Key)
- **ADDED**: Dynamic OAuth provider buttons (loaded from Supabase `/auth/v1/settings`)
- **ADDED**: Supabase Auth integration via `@supabase/supabase-js` SDK
- **ADDED**: `parseSupabaseInput()` utility — accepts Project ID or full URL
- **MODIFIED**: Adapter factory — replace generic registry with per-type factory functions (F3)
- **MODIFIED**: `SupabaseSyncAdapter` — use `supabase.functions.invoke()` instead of raw `fetch`
- **MODIFIED**: `AuthProvider` — support Supabase auth alongside Google OAuth
- **MODIFIED**: `defaultServices.ts` — switch-based adapter creation instead of registry

## Goals

- G1: Users can connect to a self-hosted or cloud Supabase backend from the app UI
- G2: OAuth sign-in via any provider enabled in the user's Supabase project
- G3: Consistent UX between GAS and Supabase connection flows

## Non-Goals

- NG1: Email/password or magic link authentication (future change)
- NG2: Migration wizard for GAS → Supabase data transfer (user uses Full Sync manually)
- NG3: Simultaneous connection to multiple backends
- NG4: Changes to SettingsPage sync section

## Users & Scenarios

- U1: **Self-hoster** — deploys Supabase instance, enters Project URL + Anon Key, signs in with Google OAuth, starts syncing
- U2: **Supabase Cloud user** — enters Project ID (e.g., `xxxxx`), app resolves to `https://xxxxx.supabase.co`, connects
- U3: **Existing GAS user switching** — disconnects from GAS in Settings, goes to Setup, connects to Supabase, uses Full Sync to push existing data
- U4: **Returning user** — app restores Supabase session from SDK storage, auto-navigates to inbox

## Requirements

### Functional

- FR1: SetupPage SHALL display a Supabase section (collapsible accordion) alongside the existing GAS section
- FR2: Supabase section SHALL have two input fields: Project URL or ID, and Anon Key
- FR3: `parseSupabaseInput()` SHALL resolve plain string input to `https://{input}.supabase.co` and pass through full URLs unchanged
- FR4: On "Connect", the app SHALL call `GET /auth/v1/settings` with the provided anon key to validate the connection and retrieve enabled OAuth providers
- FR5: If ping succeeds, the app SHALL display OAuth provider buttons for all enabled providers returned by `/auth/v1/settings`
- FR6: Clicking an OAuth provider button SHALL initiate `supabase.auth.signInWithOAuth({ provider, redirectTo: '/setup' })` using the Supabase JS SDK
- FR7: On return from OAuth redirect, the SDK SHALL exchange the code for a session (PKCE flow) and the app SHALL navigate to inbox
- FR8: `SupabaseSyncAdapter` SHALL accept a `SupabaseClient` instance and use `supabase.functions.invoke()` for all edge function calls
- FR9: Adapter factory SHALL be refactored to per-type factory functions — `createGasAdapter(url, getAccessToken)` and `createSupabaseAdapter(supabaseClient)` — removing the generic registry
- FR10: `AuthProvider` SHALL detect backend type from `connectionConfig` and render either `GoogleAuthSync` (GAS) or Supabase auth listener (`onAuthStateChange`)
- FR11: Supabase SDK client instance SHALL be created in the React client layer and passed to the adapter (B2 pattern)
- FR12: Connection config for Supabase SHALL be saved to localStorage before OAuth redirect and restored on return
- FR13: If no OAuth providers are enabled in the Supabase project, the app SHALL show an informational message directing users to configure providers in Supabase Dashboard
- FR14: Connected state for Supabase SHALL display the project URL and, if session is missing, show OAuth provider buttons for re-authentication

### Non-Functional

#### Performance

- NFR-P1: `/auth/v1/settings` request SHALL complete within 5 seconds or show a timeout error

#### Accessibility

- NFR-A1: All form inputs SHALL have visible labels and be keyboard-navigable
- NFR-A2: OAuth provider buttons SHALL have accessible names (e.g., "Sign in with Google")
- NFR-A3: Loading and error states SHALL be announced to screen readers via aria-live regions

#### Responsive

- NFR-R1: Setup form SHALL be usable on viewports from 320px to 2560px width

## UX Acceptance Criteria

- UX1: Backend selection uses accordion pattern (same as current GAS section) — both sections can be independently expanded/collapsed
- UX2: Supabase URL field placeholder shows: `https://xxxxx.supabase.co or project ID`
- UX3: Anon Key field uses monospace font and masks input (sensitive-looking string)
- UX4: OAuth provider buttons are displayed as a horizontal row with provider icons and names
- UX5: After successful connection + auth, user lands in inbox with no extra confirmation step
- UX6: Error messages are specific: "Invalid URL", "Connection failed", "No OAuth providers configured"
- UX7: Loading states show spinner during connection check and OAuth exchange

## UI States Matrix

| State | Network | Data | UI |
|---|---|---|---|
| Initial (no config) | - | No saved config | Show GAS + Supabase accordion sections |
| Supabase input | - | User typing | URL + Anon Key fields, Connect button disabled until both filled |
| Connecting | Fetching /auth/v1/settings | - | Spinner, "Connecting..." |
| Connection error | Failed/timeout | - | Error message, back to input |
| Providers loaded | Success | Providers list | Show OAuth buttons |
| No providers | Success | Empty providers | Info message: "Configure OAuth in Supabase Dashboard" |
| OAuth redirect | Redirecting | Config in localStorage | User leaves page |
| Returning from OAuth | SDK exchanging code | Config restored | Brief loading, then navigate to inbox |
| OAuth error | Failed | - | Error message, show providers again |
| Connected (with session) | - | Active config + session | URL display, Disconnect + Go to App buttons |
| Connected (no session) | - | Active config, expired session | URL display, OAuth provider buttons, Disconnect |

## Behavior

Behavior specs defined in:
- `specs/supabase-ui-connection/spec.md` — connection flow, input parsing, provider loading
- `specs/supabase-auth/spec.md` — OAuth flow, session management, auth state changes

## Affected IA

No IA changes — SetupPage already exists at `/setup`.

## Success Metrics

- M1: User can connect to Supabase backend and complete first sync within 2 minutes
- M2: All existing GAS connection tests continue to pass
- M3: Mutation testing score >= 95% on new code

## Open Questions

- Q1: Should Anon Key input be masked (type="password") or visible (type="text" with monospace)? Anon key is not secret (it's a publishable key), but looks like one.
