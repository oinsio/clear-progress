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

`SupabaseAuthSync` SHALL call `setAccessToken()` on auth events. Token persistence SHALL be handled by the configured `TokenPersistence` strategy (set to `noopPersistence` for Supabase), NOT by direct localStorage writes in tokenManager.

`SupabaseAuthSync` SHALL accept `onUserEmailUpdate`, `onUserPictureUpdate`, and `onAuthProviderUpdate` callbacks via props and extract user profile data from `session.user` during auth events.

`SupabaseAuthSync` SHALL extract `session.user.app_metadata.provider` on `SIGNED_IN` and `INITIAL_SESSION` events and call `onAuthProviderUpdate(provider)` with the provider string. On `TOKEN_REFRESHED` events, `onAuthProviderUpdate` SHALL NOT be called. On `SIGNED_OUT`, auth provider is cleared via `onClear`.

#### Scenario: Auth state synchronized on sign-in
- **WHEN** Supabase SDK fires `SIGNED_IN` event
- **THEN** `SupabaseAuthSync` calls `onTokenUpdate` with the access token and expiry
- **AND** `setAccessToken` stores the token in memory only (noopPersistence is active)
- **AND** no `access_token` or `access_token_expires_at` keys are written to localStorage
- **AND** `SupabaseAuthSync` calls `onUserEmailUpdate` with `session.user.email`
- **AND** `SupabaseAuthSync` calls `onUserPictureUpdate` with `session.user.user_metadata.avatar_url` (fallback to `user_metadata.picture`)
- **AND** avatar URL is cached in `localStorage[USER_PICTURE]`
- **AND** `signInRef`, `signOutRef`, `silentRefreshRef` are populated with Supabase-specific functions
- **AND** `SupabaseAuthSync` calls `onAuthProviderUpdate` with `session.user.app_metadata.provider`

#### Scenario: Provider extracted on initial session
- **WHEN** Supabase SDK fires `INITIAL_SESSION` event
- **AND** session exists
- **THEN** `SupabaseAuthSync` calls `onAuthProviderUpdate` with `session.user.app_metadata.provider`

#### Scenario: Profile restored from session on initial load
- **WHEN** Supabase SDK fires `INITIAL_SESSION` event
- **AND** no avatar is cached in localStorage
- **THEN** `SupabaseAuthSync` extracts email and avatar from `session.user` and calls the respective callbacks

#### Scenario: Cached profile not overwritten on initial load
- **WHEN** Supabase SDK fires `INITIAL_SESSION` event
- **AND** avatar is already cached in localStorage
- **THEN** `SupabaseAuthSync` calls `onUserEmailUpdate` with `session.user.email`
- **AND** `SupabaseAuthSync` SHALL NOT call `onUserPictureUpdate`

#### Scenario: Token refreshed by SDK
- **WHEN** Supabase SDK fires `TOKEN_REFRESHED` event
- **THEN** `SupabaseAuthSync` calls `onTokenUpdate` and `setAccessToken` with the new token
- **AND** token is updated in memory only
- **AND** `SupabaseAuthSync` SHALL NOT call `onUserEmailUpdate` or `onUserPictureUpdate`

#### Scenario: Provider not updated on token refresh
- **WHEN** Supabase SDK fires `TOKEN_REFRESHED` event
- **THEN** `SupabaseAuthSync` SHALL NOT call `onAuthProviderUpdate`

#### Scenario: Auth state synchronized on sign-out
- **WHEN** Supabase SDK fires `SIGNED_OUT` event
- **THEN** `SupabaseAuthSync` calls `setAccessToken(null)` and `onClear`
- **AND** `onClear` resets `authProvider` to `null` in AuthProvider
- **AND** no localStorage cleanup of `access_token` keys is needed (they were never written)
- **AND** refs are reset to no-ops

#### Scenario: Avatar cache cleared on sign-out
- **WHEN** user signs out via `signOutRef`
- **THEN** `localStorage[USER_PICTURE]` is removed
- **AND** `supabase.auth.signOut()` is called

### Requirement: AuthProvider detects backend type
`AuthProvider` SHALL read `connectionConfig.type` to determine which auth mechanism to render. For `"gas"` it SHALL render `GoogleOAuthProvider` + `GoogleAuthSync`. For `"supabase"` it SHALL render `SupabaseAuthSync` with the Supabase client instance.

`AuthProvider` SHALL call `configureTokenPersistence(localStoragePersistence)` for GAS backend during state initialization, before first render. For Supabase backend (or no backend), the default `noopPersistence` SHALL remain active.

`AuthProvider` SHALL initialize `accessToken` state via `getAccessToken()` (which returns the token restored by the configured persistence strategy, or null if noopPersistence is active).

`AuthProvider` SHALL pass `handleUserEmailUpdate`, `handleUserPictureUpdate`, and `handleAuthProviderUpdate` callbacks to `SupabaseAuthSync`.

`AuthProvider` SHALL expose `authProvider: string | null` in its context value. The value SHALL be `null` when no provider info is available (GAS backend, no backend, or signed out).

#### Scenario: GAS backend uses Google auth
- **WHEN** connection config has `type: "gas"` with a clientId
- **THEN** `GoogleOAuthProvider` and `GoogleAuthSync` are rendered

#### Scenario: GAS backend restores token from localStorage
- **WHEN** connection config has `type: "gas"`
- **THEN** `AuthProvider` calls `configureTokenPersistence(localStoragePersistence)`
- **AND** tokenManager restores token from localStorage if not expired
- **AND** initial `accessToken` state reflects the restored token

#### Scenario: Supabase backend uses Supabase auth with provider
- **WHEN** connection config has `type: "supabase"`
- **THEN** `SupabaseAuthSync` is rendered with the Supabase client instance
- **AND** `onUserEmailUpdate`, `onUserPictureUpdate`, and `onAuthProviderUpdate` callbacks are passed to `SupabaseAuthSync`
- **AND** `authProvider` is exposed in context

#### Scenario: GAS backend has null authProvider
- **WHEN** connection config has `type: "gas"`
- **THEN** `authProvider` in context is `null`

#### Scenario: No backend has null authProvider
- **WHEN** no connection config exists
- **THEN** `authProvider` in context is `null`

#### Scenario: authProvider reset on disconnect
- **WHEN** user disconnects from Supabase backend
- **THEN** `authProvider` in context is reset to `null`

#### Scenario: Supabase backend starts with null token
- **WHEN** connection config has `type: "supabase"`
- **THEN** `AuthProvider` does NOT call `configureTokenPersistence`
- **AND** default `noopPersistence` remains active
- **AND** initial `accessToken` state is null
- **AND** token is set later via `onAuthStateChange` INITIAL_SESSION event

#### Scenario: No backend configured
- **WHEN** no connection config exists
- **THEN** neither auth mechanism is rendered
- **AND** `signIn`/`signOut`/`silentRefresh` are no-ops
- **AND** default `noopPersistence` remains active
- **AND** initial `accessToken` state is null

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

### Requirement: Email auth sessions handled by SupabaseAuthSync

Email-based authentication (OTP verification and magic link) SHALL produce standard Supabase `SIGNED_IN` events with session objects identical in structure to OAuth sessions. `SupabaseAuthSync` SHALL handle these events without modification. The `session.user.app_metadata.provider` for email auth SHALL be `"email"`, which is already handled by the generic provider extraction logic.

#### Scenario: Email OTP session produces SIGNED_IN event
- **WHEN** user verifies OTP code successfully
- **THEN** Supabase SDK fires `SIGNED_IN` event
- **AND** session contains `access_token`, `expires_in`, `user.email`, and `user.app_metadata.provider = "email"`
- **AND** `SupabaseAuthSync` calls `onTokenUpdate`, `onUserEmailUpdate`, and `onAuthProviderUpdate("email")`

#### Scenario: Magic link session produces SIGNED_IN event
- **WHEN** user clicks magic link and returns to app
- **THEN** Supabase SDK fires `SIGNED_IN` event
- **AND** session contains `access_token`, `expires_in`, `user.email`, and `user.app_metadata.provider = "email"`
- **AND** `SupabaseAuthSync` calls `onTokenUpdate`, `onUserEmailUpdate`, and `onAuthProviderUpdate("email")`

#### Scenario: Email auth user has no avatar
- **WHEN** user authenticates via email
- **AND** `session.user.user_metadata` does not contain `avatar_url` or `picture`
- **THEN** `SupabaseAuthSync` calls `onUserPictureUpdate(null)`

### Requirement: ProviderIcon supports email provider

`ProviderIcon` SHALL render a `Mail` icon from `lucide-react` when `provider` is `"email"`. The icon SHALL use `aria-hidden="true"` consistent with other provider icons.

#### Scenario: Email provider renders mail icon
- **WHEN** `provider` is `"email"`
- **THEN** `Mail` icon from lucide-react is rendered with `aria-hidden="true"`
