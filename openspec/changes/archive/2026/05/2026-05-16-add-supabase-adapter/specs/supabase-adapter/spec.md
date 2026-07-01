## ADDED Requirements

### Requirement: SupabaseSyncAdapter implements SyncAdapter interface
The `SupabaseSyncAdapter` class SHALL implement all 9 methods of the `SyncAdapter` interface: `ping`, `init`, `pull`, `push`, `uploadCover`, `uploadCovers`, `getCover`, `deleteCover`, `purge`. Each method SHALL send an HTTP request to the corresponding Supabase Edge Function and validate the response against the existing Zod schemas from `@clear-progress/contract`.

#### Scenario: Adapter passes all contract tests
- **WHEN** `syncAdapterContract()` is run with `SupabaseSyncAdapter`
- **THEN** all contract tests pass without modification

#### Scenario: Adapter is instantiated with URL and token getter
- **WHEN** `new SupabaseSyncAdapter(url, getAccessToken)` is called
- **THEN** adapter stores URL as the Supabase project URL and uses `getAccessToken` to obtain JWT for authenticated requests

### Requirement: Authenticated requests include Bearer token
All methods except `ping()` SHALL include the JWT token from `getAccessToken()` as a Bearer token in the Authorization header. If `getAccessToken()` returns null, the adapter SHALL throw `ApiAuthError`.

#### Scenario: Auth token included in request
- **WHEN** adapter calls any authenticated Edge Function
- **THEN** request includes header `Authorization: Bearer <token>`

#### Scenario: Missing token throws ApiAuthError
- **WHEN** `getAccessToken()` returns null
- **AND** any authenticated method is called
- **THEN** `ApiAuthError` is thrown before making the HTTP request

### Requirement: Ping works without authentication
The `ping()` method SHALL call the `/ping` Edge Function without an Authorization header.

#### Scenario: Ping without token
- **WHEN** `ping()` is called and no token is available
- **THEN** request is sent without Authorization header
- **AND** response `{ ok: true, initialized: false }` is returned

### Requirement: Request timeout
All HTTP requests SHALL have a timeout of 30 seconds. If the request exceeds this timeout, the adapter SHALL abort the request and throw an error.

#### Scenario: Request exceeds timeout
- **WHEN** Edge Function does not respond within 30 seconds
- **THEN** request is aborted via AbortController
- **AND** an error is thrown

### Requirement: Response validation
All responses SHALL be validated against the corresponding Zod schema from `@clear-progress/contract`. If validation fails, `ApiValidationError` SHALL be thrown.

#### Scenario: Invalid response shape
- **WHEN** Edge Function returns JSON that does not match the expected schema
- **THEN** `ApiValidationError` is thrown with the action name and validation error

### Requirement: Adapter registration in adapter-loader
The adapter SHALL be registered in `@clear-progress/adapter-loader` with key `"supabase"` so that `createAdapter("supabase", url, getAccessToken)` returns a `SupabaseSyncAdapter` instance.

#### Scenario: Adapter created via registry
- **WHEN** `createAdapter("supabase", url, getAccessToken)` is called
- **THEN** a `SupabaseSyncAdapter` instance is returned
