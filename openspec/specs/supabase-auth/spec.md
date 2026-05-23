# Capability: Supabase Auth

## Purpose

Authentication integration with Supabase: OAuth sign-in flow, session management via SDK, and synchronization of auth state with the app's AuthProvider.

## Requirements

### Requirement: OAuth sign-in via Supabase SDK
Clicking an OAuth provider button SHALL call `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })` where `redirectTo` points to the SetupPage URL. The SDK SHALL handle the PKCE flow automatically.

#### Scenario: OAuth redirect initiated
- **WHEN** user clicks "Sign in with Google" button
- **THEN** `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/setup' } })` is called
- **AND** user is redirected to Google's OAuth consent screen

### Requirement: Session exchange on OAuth callback
When the user returns from OAuth redirect to `/setup?code=xxx`, the Supabase SDK SHALL automatically exchange the authorization code for a session. On successful session creation, the app SHALL navigate to the inbox.

#### Scenario: Successful OAuth callback
- **WHEN** user returns to `/setup` with authorization code in URL
- **THEN** SDK exchanges code for session via PKCE
- **AND** `onAuthStateChange` fires with `SIGNED_IN` event
- **AND** app navigates to inbox

#### Scenario: OAuth callback with error
- **WHEN** OAuth redirect returns with an error parameter
- **THEN** error message is displayed on SetupPage
- **AND** OAuth provider buttons remain available for retry

### Requirement: SupabaseAuthSync renderless component
`SupabaseAuthSync` SHALL be a renderless React component (returns null) that listens to `supabase.auth.onAuthStateChange()` and synchronizes auth state with `AuthProvider` context via refs (same pattern as `GoogleAuthSync`).

#### Scenario: Auth state synchronized on sign-in
- **WHEN** Supabase SDK fires `SIGNED_IN` event
- **THEN** `SupabaseAuthSync` calls `onTokenUpdate` with the access token and expiry
- **AND** `signInRef`, `signOutRef`, `silentRefreshRef` are populated with Supabase-specific functions

#### Scenario: Auth state synchronized on sign-out
- **WHEN** Supabase SDK fires `SIGNED_OUT` event
- **THEN** `SupabaseAuthSync` calls `onClear`
- **AND** refs are reset to no-ops

#### Scenario: Token refresh handled by SDK
- **WHEN** Supabase SDK fires `TOKEN_REFRESHED` event
- **THEN** `SupabaseAuthSync` calls `onTokenUpdate` with the new access token and expiry

### Requirement: AuthProvider detects backend type
`AuthProvider` SHALL read `connectionConfig.type` to determine which auth mechanism to render. For `"gas"` it SHALL render `GoogleOAuthProvider` + `GoogleAuthSync`. For `"supabase"` it SHALL render `SupabaseAuthSync` with the Supabase client instance.

#### Scenario: GAS backend uses Google auth
- **WHEN** connection config has `type: "gas"` with a clientId
- **THEN** `GoogleOAuthProvider` and `GoogleAuthSync` are rendered

#### Scenario: Supabase backend uses Supabase auth
- **WHEN** connection config has `type: "supabase"`
- **THEN** `SupabaseAuthSync` is rendered with the Supabase client instance

#### Scenario: No backend configured
- **WHEN** no connection config exists
- **THEN** neither auth mechanism is rendered
- **AND** `signIn`/`signOut`/`silentRefresh` are no-ops

### Requirement: Supabase client instance created in React layer
The `SupabaseClient` instance SHALL be created in the React client layer using `createClient(url, anonKey)` from `@supabase/supabase-js`. The same instance SHALL be used for both auth and passed to the adapter.

#### Scenario: Single client instance shared
- **WHEN** Supabase connection is active
- **THEN** one `SupabaseClient` instance is created
- **AND** the same instance is used by `SupabaseAuthSync` and `SupabaseSyncAdapter`

### Requirement: Connection config saved before OAuth redirect
The Supabase connection config (type, url, anonKey, isActive) SHALL be saved to localStorage before initiating the OAuth redirect, so it can be restored when the user returns.

#### Scenario: Config persists across redirect
- **WHEN** user clicks an OAuth button on SetupPage
- **THEN** connection config is already in localStorage (saved during Connect step)
- **AND** after OAuth redirect and return, config is restored from localStorage
