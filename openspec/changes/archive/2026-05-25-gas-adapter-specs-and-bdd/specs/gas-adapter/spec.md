## ADDED Requirements

### Requirement: GasSyncAdapter implements SyncAdapter interface
The `GasSyncAdapter` class SHALL implement all 9 methods of the `SyncAdapter` interface: `ping`, `init`, `pull`, `push`, `uploadCover`, `uploadCovers`, `getCover`, `deleteCover`, `purge`. Each method SHALL call the GAS web app URL via HTTP and validate the response against the corresponding Zod schema from `@clear-progress/contract`.

#### Scenario: Adapter passes all contract tests
- **WHEN** `syncAdapterContract()` is run with `GasSyncAdapter`
- **THEN** all contract tests pass without modification

#### Scenario: Adapter is instantiated via factory function
- **WHEN** `createGasAdapter(url, getAccessToken)` is called
- **THEN** a `GasSyncAdapter` instance is returned implementing `SyncAdapter`

### Requirement: Ping uses GET without authentication
The `ping()` method SHALL send an HTTP GET request to `{url}?action=ping` without any authentication token. The response SHALL be validated against `PingResponseSchema`.

#### Scenario: Ping via GET
- **WHEN** `ping()` is called
- **THEN** an HTTP GET request is sent to `{url}?action=ping`
- **AND** no `access_token` is included in the request
- **AND** response follows redirect

#### Scenario: Ping with invalid JSON response
- **WHEN** `ping()` receives a non-JSON response
- **THEN** an error is thrown with message "Invalid response: expected JSON"

#### Scenario: Ping with invalid response shape
- **WHEN** `ping()` receives JSON that does not match `PingResponseSchema`
- **THEN** `ApiValidationError` is thrown with action "ping"

### Requirement: All non-ping actions use POST with access_token
All methods except `ping()` SHALL send HTTP POST requests to the GAS URL with `Content-Type: text/plain`. The request body SHALL be a JSON object containing `action` (the action name), `access_token` (from `getAccessToken()`), and the action-specific payload fields.

#### Scenario: POST request format
- **WHEN** `pull({ since_revision: 5 })` is called
- **THEN** HTTP POST is sent with body `{ action: "pull", access_token: "<token>", since_revision: 5 }`
- **AND** `Content-Type` header is `text/plain`

#### Scenario: Action names map to SyncAdapter methods
- **WHEN** each SyncAdapter method is called
- **THEN** the `action` field matches: `init` → "init", `pull` → "pull", `push` → "push", `uploadCover` → "upload_cover", `uploadCovers` → "upload_covers", `getCover` → "get_cover", `deleteCover` → "delete_cover", `purge` → "purge"

#### Scenario: Purge sends confirm flag
- **WHEN** `purge()` is called
- **THEN** request body includes `{ action: "purge", confirm: true }`

### Requirement: Authentication error when no token available
If `getAccessToken()` returns `null`, the adapter SHALL throw `ApiAuthError` immediately without making an HTTP request.

#### Scenario: Null token throws ApiAuthError
- **WHEN** `getAccessToken()` returns `null`
- **AND** any non-ping method is called
- **THEN** `ApiAuthError` is thrown
- **AND** no HTTP request is made

### Requirement: Server auth error detection
If the server response JSON contains `error: "UNAUTHORIZED"`, the adapter SHALL throw `ApiAuthError` regardless of HTTP status code.

#### Scenario: UNAUTHORIZED error in response body
- **WHEN** server responds with `{ ok: false, error: "UNAUTHORIZED", message: "..." }`
- **THEN** `ApiAuthError` is thrown

### Requirement: Response validation via Zod schemas
All responses SHALL be validated against the corresponding Zod schema. If validation fails, `ApiValidationError` SHALL be thrown with the action name and the Zod error.

#### Scenario: Valid response passes validation
- **WHEN** server responds with JSON matching the expected schema
- **THEN** the parsed and validated data is returned

#### Scenario: Invalid response shape
- **WHEN** server responds with JSON that does not match the expected schema
- **THEN** `ApiValidationError` is thrown with the action name

### Requirement: Request timeout with AbortController
Each POST request SHALL have a timeout of `API_TIMEOUT_MS` (30000 ms). The timeout SHALL be implemented via `AbortController` and `setTimeout`. The timeout timer SHALL be cleared after the request completes (success or failure).

#### Scenario: Request completes within timeout
- **WHEN** server responds within 30 seconds
- **THEN** response is returned normally
- **AND** timeout timer is cleared

#### Scenario: Request exceeds timeout
- **WHEN** server does not respond within 30 seconds
- **THEN** the request is aborted via `AbortController.abort()`

### Requirement: HTTP error handling
If the HTTP response status is not OK (not 2xx), the adapter SHALL throw an error with the HTTP status code.

#### Scenario: HTTP 500 error
- **WHEN** server responds with HTTP status 500
- **THEN** error is thrown with message "HTTP error: 500"
