# Capability: Supabase Auth (delta)

## MODIFIED Requirements

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

#### Scenario: Provider not updated on token refresh
- **WHEN** Supabase SDK fires `TOKEN_REFRESHED` event
- **THEN** `SupabaseAuthSync` SHALL NOT call `onAuthProviderUpdate`

#### Scenario: Auth state synchronized on sign-out
- **WHEN** Supabase SDK fires `SIGNED_OUT` event
- **THEN** `SupabaseAuthSync` calls `setAccessToken(null)` and `onClear`
- **AND** `onClear` resets `authProvider` to `null` in AuthProvider

### Requirement: AuthProvider detects backend type
`AuthProvider` SHALL read `connectionConfig.type` to determine which auth mechanism to render. For `"gas"` it SHALL render `GoogleOAuthProvider` + `GoogleAuthSync`. For `"supabase"` it SHALL render `SupabaseAuthSync` with the Supabase client instance.

`AuthProvider` SHALL call `configureTokenPersistence(localStoragePersistence)` for GAS backend during state initialization, before first render. For Supabase backend (or no backend), the default `noopPersistence` SHALL remain active.

`AuthProvider` SHALL initialize `accessToken` state via `getAccessToken()` (which returns the token restored by the configured persistence strategy, or null if noopPersistence is active).

`AuthProvider` SHALL pass `handleUserEmailUpdate`, `handleUserPictureUpdate`, and `handleAuthProviderUpdate` callbacks to `SupabaseAuthSync`.

`AuthProvider` SHALL expose `authProvider: string | null` in its context value. The value SHALL be `null` when no provider info is available (GAS backend, no backend, or signed out).

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
