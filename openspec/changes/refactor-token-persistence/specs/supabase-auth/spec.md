## MODIFIED Requirements

### Requirement: SupabaseAuthSync renderless component
`SupabaseAuthSync` SHALL be a renderless React component (returns null) that listens to `supabase.auth.onAuthStateChange()` and synchronizes auth state with `AuthProvider` context via refs (same pattern as `GoogleAuthSync`).

`SupabaseAuthSync` SHALL call `setAccessToken()` on auth events. Token persistence SHALL be handled by the configured `TokenPersistence` strategy (set to `noopPersistence` for Supabase), NOT by direct localStorage writes in tokenManager.

`SupabaseAuthSync` SHALL accept `onUserEmailUpdate` and `onUserPictureUpdate` callbacks via props and extract user profile data from `session.user` during auth events.

#### Scenario: Auth state synchronized on sign-in
- **WHEN** Supabase SDK fires `SIGNED_IN` event
- **THEN** `SupabaseAuthSync` calls `onTokenUpdate` with the access token and expiry
- **AND** `setAccessToken` stores the token in memory only (noopPersistence is active)
- **AND** no `access_token` or `access_token_expires_at` keys are written to localStorage

#### Scenario: Token refreshed by SDK
- **WHEN** Supabase SDK fires `TOKEN_REFRESHED` event
- **THEN** `SupabaseAuthSync` calls `onTokenUpdate` and `setAccessToken` with the new token
- **AND** token is updated in memory only

#### Scenario: Auth state synchronized on sign-out
- **WHEN** Supabase SDK fires `SIGNED_OUT` event
- **THEN** `SupabaseAuthSync` calls `setAccessToken(null)` and `onClear`
- **AND** no localStorage cleanup of `access_token` keys is needed (they were never written)

### Requirement: AuthProvider detects backend type
`AuthProvider` SHALL read `connectionConfig.type` to determine which auth mechanism to render. For `"gas"` it SHALL render `GoogleOAuthProvider` + `GoogleAuthSync`. For `"supabase"` it SHALL render `SupabaseAuthSync` with the Supabase client instance.

`AuthProvider` SHALL call `configureTokenPersistence(localStoragePersistence)` for GAS backend during state initialization, before first render. For Supabase backend (or no backend), the default `noopPersistence` SHALL remain active.

`AuthProvider` SHALL initialize `accessToken` state via `getAccessToken()` (which returns the token restored by the configured persistence strategy, or null if noopPersistence is active).

#### Scenario: GAS backend restores token from localStorage
- **WHEN** connection config has `type: "gas"`
- **THEN** `AuthProvider` calls `configureTokenPersistence(localStoragePersistence)`
- **AND** tokenManager restores token from localStorage if not expired
- **AND** initial `accessToken` state reflects the restored token

#### Scenario: Supabase backend starts with null token
- **WHEN** connection config has `type: "supabase"`
- **THEN** `AuthProvider` does NOT call `configureTokenPersistence`
- **AND** default `noopPersistence` remains active
- **AND** initial `accessToken` state is null
- **AND** token is set later via `onAuthStateChange` INITIAL_SESSION event

#### Scenario: No backend configured
- **WHEN** no connection config exists
- **THEN** default `noopPersistence` remains active
- **AND** initial `accessToken` state is null
