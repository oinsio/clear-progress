## ADDED Requirements

### Requirement: doGet handles ping action only
The `doGet` handler SHALL accept an `action` query parameter. If `action` is `"ping"`, it SHALL return the ping response. For any other action (or missing action), it SHALL return an error with code `INVALID_ACTION`.

#### Scenario: Ping via GET
- **WHEN** GET request arrives with `?action=ping`
- **THEN** ping response is returned

#### Scenario: Unknown action via GET
- **WHEN** GET request arrives with `?action=pull`
- **THEN** error response is returned with code `INVALID_ACTION` and message containing "Unknown action: pull"

#### Scenario: Missing action via GET
- **WHEN** GET request arrives without `action` parameter
- **THEN** error response is returned with code `INVALID_ACTION`

### Requirement: doPost parses JSON body and validates token
The `doPost` handler SHALL parse the request body as JSON, extract `action`, `access_token`, and the remaining payload. If parsing fails, it SHALL return `INVALID_PAYLOAD` error. If `access_token` is missing or not a string, it SHALL return `UNAUTHORIZED` error.

#### Scenario: Valid JSON body with token
- **WHEN** POST arrives with valid JSON containing `action`, `access_token`, and payload
- **THEN** token is verified and action is dispatched

#### Scenario: Invalid JSON body
- **WHEN** POST arrives with malformed JSON
- **THEN** error response with code `INVALID_PAYLOAD` and message "Request body must be valid JSON"

#### Scenario: Missing access_token
- **WHEN** POST arrives with valid JSON but no `access_token` field
- **THEN** error response with code `UNAUTHORIZED` and message "access_token is required"

#### Scenario: Non-string access_token
- **WHEN** POST arrives with `access_token: 123` (number, not string)
- **THEN** error response with code `UNAUTHORIZED`

### Requirement: doPost routes actions to handlers
The `doPost` handler SHALL dispatch to the correct action handler based on the `action` field. Supported actions: `init`, `pull`, `push`, `upload_cover`, `upload_covers`, `delete_cover`, `get_cover`, `purge`. Unknown actions SHALL return `INVALID_ACTION` error.

#### Scenario: Each action routes to its handler
- **WHEN** POST arrives with `action: "pull"` and valid token
- **THEN** the `pull()` handler is invoked with the remaining payload

#### Scenario: Unknown action via POST
- **WHEN** POST arrives with `action: "unknown_action"`
- **THEN** error response with code `INVALID_ACTION` and message containing "Unknown action: unknown_action"

### Requirement: Authentication via Google tokeninfo API
The server SHALL verify the `access_token` by calling `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=<token>` via `UrlFetchApp.fetch()`. The response SHALL contain `email` and `email_verified` fields.

#### Scenario: Valid token with verified email
- **WHEN** tokeninfo returns HTTP 200 with `{ email: "user@example.com", email_verified: "true" }`
- **THEN** authentication succeeds with `{ ok: true, email: "user@example.com" }`

#### Scenario: Token with unverified email
- **WHEN** tokeninfo returns `{ email_verified: "false" }`
- **THEN** authentication fails with reason `EMAIL_NOT_VERIFIED`

#### Scenario: Invalid or expired token
- **WHEN** tokeninfo returns non-200 status
- **THEN** authentication fails with reason `INVALID_RESPONSE`

#### Scenario: Tokeninfo returns unexpected shape
- **WHEN** tokeninfo returns 200 but missing `email` field
- **THEN** authentication fails with reason `INVALID_RESPONSE`

### Requirement: Owner email auto-registration
On the first successful authentication, the server SHALL store the verified email as `OWNER_EMAIL` in `PropertiesService.getScriptProperties()`. Subsequent requests SHALL verify that the token's email matches `OWNER_EMAIL`. Mismatched emails SHALL be rejected with reason `WRONG_ACCOUNT`.

#### Scenario: First call registers owner email
- **WHEN** first valid token is verified with email "owner@example.com"
- **AND** `OWNER_EMAIL` property does not exist
- **THEN** `OWNER_EMAIL` is set to "owner@example.com" in PropertiesService
- **AND** authentication succeeds

#### Scenario: Matching owner email
- **WHEN** token email matches stored `OWNER_EMAIL`
- **THEN** authentication succeeds

#### Scenario: Wrong account
- **WHEN** token email is "other@example.com" but `OWNER_EMAIL` is "owner@example.com"
- **THEN** authentication fails with reason `WRONG_ACCOUNT`

### Requirement: Network error handling during token verification
If `UrlFetchApp.fetch()` throws an exception during token verification, the server SHALL classify the error. If the error message contains a GAS permission scope URL, reason SHALL be `GAS_PERMISSION_ERROR`. Otherwise, reason SHALL be `NETWORK_ERROR`.

#### Scenario: Network error during verification
- **WHEN** `UrlFetchApp.fetch()` throws a network error
- **THEN** authentication fails with reason `NETWORK_ERROR` and error details

#### Scenario: GAS permission error
- **WHEN** `UrlFetchApp.fetch()` throws with message containing "https://www.googleapis.com/auth/"
- **THEN** authentication fails with reason `GAS_PERMISSION_ERROR`

### Requirement: Auth failure reasons map to error messages
Each `AuthFailureReason` SHALL be mapped to a human-readable error message in the response. The mapping SHALL be: `NETWORK_ERROR` → "Token verification failed: network error", `GAS_PERMISSION_ERROR` → "GAS script is not authorized to make external requests...", `INVALID_RESPONSE` → "Token is invalid or expired", `EMAIL_NOT_VERIFIED` → "Google account email is not verified", `WRONG_ACCOUNT` → "Token belongs to a different account".

#### Scenario: Error message includes details when available
- **WHEN** auth fails with reason `NETWORK_ERROR` and details "connection refused"
- **THEN** response message is "Token verification failed: network error: connection refused"

#### Scenario: Error message without details
- **WHEN** auth fails with reason `INVALID_RESPONSE` and no details
- **THEN** response message is "Token is invalid or expired"

### Requirement: Error response format
All error responses SHALL follow the format `{ ok: false, error: "<CODE>", message: "<human-readable>" }`. Error codes SHALL be: `INVALID_ACTION`, `INVALID_PAYLOAD`, `NOT_INITIALIZED`, `INTERNAL_ERROR`, `FILE_TOO_LARGE`, `FILE_NOT_FOUND`, `UNAUTHORIZED`.

#### Scenario: Error response structure
- **WHEN** any error occurs
- **THEN** response is JSON with `ok: false`, `error` (code string), and `message` (description)

#### Scenario: Success response structure
- **WHEN** action completes successfully
- **THEN** response is JSON with `ok: true` and action-specific data fields

### Requirement: Ping returns server health status
The `ping()` action SHALL return `{ ok: true, app: "clear_progress", version: "1.0", initialized: <boolean> }`. The `initialized` field SHALL be `true` if `SPREADSHEET_ID` property exists and the corresponding Drive file exists, `false` otherwise. Ping SHALL NOT require authentication.

#### Scenario: Ping when initialized
- **WHEN** `ping()` is called and `SPREADSHEET_ID` property points to existing file
- **THEN** response is `{ ok: true, app: "clear_progress", version: "1.0", initialized: true }`

#### Scenario: Ping when not initialized
- **WHEN** `ping()` is called and `SPREADSHEET_ID` property is not set
- **THEN** response has `initialized: false`
