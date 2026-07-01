## MODIFIED Requirements

### Requirement: Supabase adapter detects HTTP 540 and throws ProjectPausedError
The `SupabaseSyncAdapter.invoke()` method SHALL check if a `FunctionsHttpError` has `error.context.status === 540`. If so, it SHALL throw `ProjectPausedError` instead of a generic `Error`.

#### Scenario: HTTP 540 detected as project paused
- **WHEN** Supabase Edge Function returns HTTP 540
- **THEN** `invoke()` throws `ProjectPausedError`

#### Scenario: Other HTTP errors handled as before
- **WHEN** Supabase Edge Function returns HTTP 500
- **THEN** `invoke()` throws generic `Error` (existing behavior)

#### Scenario: HTTP 401 still handled as auth error
- **WHEN** Supabase Edge Function returns HTTP 401
- **THEN** `invoke()` throws `ApiAuthError` (existing behavior)
