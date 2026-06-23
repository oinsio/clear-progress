# Capability: Supabase Adapter

## Purpose

Sync adapter implementation for Supabase backend: translates SyncAdapter interface calls to Supabase Edge Function invocations via the Supabase SDK.

## Requirements

### Requirement: SupabaseSyncAdapter implements SyncAdapter interface
The `SupabaseSyncAdapter` class SHALL implement all 9 methods of the `SyncAdapter` interface: `ping`, `init`, `pull`, `push`, `uploadCover`, `uploadCovers`, `getCover`, `deleteCover`, `purge`. Each method SHALL call the corresponding Supabase Edge Function via `supabase.functions.invoke()` and validate the response against the existing Zod schemas from `@clear-progress/contract`.

#### Scenario: Adapter passes all contract tests
- **WHEN** `syncAdapterContract()` is run with `SupabaseSyncAdapter`
- **THEN** all contract tests pass without modification

#### Scenario: Adapter is instantiated with SupabaseClient
- **WHEN** `new SupabaseSyncAdapter(supabaseClient)` is called
- **THEN** adapter stores the client and uses `supabase.functions.invoke()` for all requests

### Requirement: Adapter uses supabase.functions.invoke for requests
All edge function calls SHALL use `supabase.functions.invoke(functionName, { body })` instead of raw `fetch`. The SDK automatically includes `apikey` and `Authorization` headers.

#### Scenario: Edge function called via SDK
- **WHEN** adapter calls `pull({ since_revision: "5" })`
- **THEN** `supabase.functions.invoke("pull", { body: { since_revision: "5" } })` is called
- **AND** SDK includes `apikey` and `Authorization` headers automatically

#### Scenario: Auth error from SDK
- **WHEN** Supabase session is expired and SDK returns a 401 error
- **THEN** adapter throws `ApiAuthError`

### Requirement: Ping works without authentication
The `ping()` method SHALL call the Supabase Edge Function `/ping` without requiring an active session. If the SDK client has no session, the request SHALL still be sent (with only `apikey` header).

#### Scenario: Ping without session
- **WHEN** `ping()` is called and no Supabase session exists
- **THEN** request is sent with `apikey` header only
- **AND** response `{ ok: true, initialized: false }` is returned

### Requirement: Response validation
All responses SHALL be validated against the corresponding Zod schema from `@clear-progress/contract`. If validation fails, `ApiValidationError` SHALL be thrown.

#### Scenario: Invalid response shape
- **WHEN** Edge Function returns JSON that does not match the expected schema
- **THEN** `ApiValidationError` is thrown with the action name and validation error

### Requirement: Adapter registration replaced with per-type factory
`adapter-supabase` SHALL export `createSupabaseAdapter(supabaseClient)` as the factory function for creating Supabase sync adapters.  # implements FR4 of gas-remove

#### Scenario: Supabase adapter created via factory
- **WHEN** `createSupabaseAdapter(supabaseClient)` is called
- **THEN** a `SupabaseSyncAdapter` instance is returned
