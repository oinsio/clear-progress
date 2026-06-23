## MODIFIED Requirements

### Requirement: AuthProvider detects backend type

`AuthProvider` SHALL read `connectionConfig.type` to determine which auth mechanism to render. For `"supabase"` it SHALL render `SupabaseAuthSync` with the Supabase client instance.  # implements FR5 of gas-remove

`AuthProvider` SHALL initialize `accessToken` state via `getAccessToken()` (which returns null since `noopPersistence` is always active).

`AuthProvider` SHALL pass `handleUserEmailUpdate`, `handleUserPictureUpdate`, and `handleAuthProviderUpdate` callbacks to `SupabaseAuthSync`.

`AuthProvider` SHALL expose `authProvider: string | null` in its context value. The value SHALL be `null` when no backend is configured or user is signed out.

#### Scenario: Supabase backend uses Supabase auth with provider
- **WHEN** connection config has `type: "supabase"`
- **THEN** `SupabaseAuthSync` is rendered with the Supabase client instance
- **AND** `onUserEmailUpdate`, `onUserPictureUpdate`, and `onAuthProviderUpdate` callbacks are passed to `SupabaseAuthSync`
- **AND** `authProvider` is exposed in context

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

## REMOVED Requirements

### Requirement: GAS backend uses Google auth
**Reason**: GAS backend removed. `GoogleOAuthProvider` and `GoogleAuthSync` are deleted.
**Migration**: None needed — Supabase handles Google OAuth via `supabase.auth.signInWithOAuth()`.

### Requirement: GAS backend restores token from localStorage
**Reason**: GAS backend removed. `configureTokenPersistence(localStoragePersistence)` call is removed.
**Migration**: None needed — `noopPersistence` is always active.

### Requirement: GAS backend has null authProvider
**Reason**: GAS backend removed.
**Migration**: None needed.
