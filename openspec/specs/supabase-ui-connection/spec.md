# Capability: Supabase UI Connection

## Purpose

SetupPage UI for connecting to a Supabase backend: entering project URL/Anon Key, validating the connection, and displaying connected state with OAuth provider discovery.

## Requirements

### Requirement: SetupPage displays Supabase connection section
SetupPage SHALL display a collapsible "Supabase" section alongside the existing "Google Apps Script" section. Both sections SHALL use the accordion pattern and be independently expandable/collapsible.

#### Scenario: Both backend sections visible
- **WHEN** user opens SetupPage with no active connection
- **THEN** both "Google Apps Script" and "Supabase" sections are displayed
- **AND** each section can be expanded/collapsed independently

### Requirement: Supabase section has URL and Anon Key inputs
The Supabase section SHALL contain two input fields: Project URL or ID, and Anon Key. The Connect button SHALL be disabled until both fields have non-empty values.

#### Scenario: Empty inputs disable Connect
- **WHEN** Supabase section is expanded
- **AND** either URL or Anon Key field is empty
- **THEN** Connect button is disabled

#### Scenario: Both fields filled enables Connect
- **WHEN** user enters a value in both URL and Anon Key fields
- **THEN** Connect button is enabled

### Requirement: parseSupabaseInput resolves Project ID to URL
`parseSupabaseInput()` SHALL accept either a full HTTPS URL or a plain Project ID string. A plain string (not starting with `https://`) SHALL be resolved to `https://{input}.supabase.co`. A full URL SHALL be passed through unchanged.

#### Scenario: Plain Project ID resolved to URL
- **WHEN** input is `xxxxx`
- **THEN** result is `https://xxxxx.supabase.co`

#### Scenario: Full URL passed through
- **WHEN** input is `https://supabase.myserver.com`
- **THEN** result is `https://supabase.myserver.com`

#### Scenario: Whitespace trimmed
- **WHEN** input is `  xxxxx  `
- **THEN** result is `https://xxxxx.supabase.co`

### Requirement: Connect validates via /auth/v1/settings
On Connect, the app SHALL send `GET /auth/v1/settings` with the `apikey` header set to the provided Anon Key. A successful response validates the URL and Anon Key combination.

#### Scenario: Successful connection check
- **WHEN** user clicks Connect with valid URL and Anon Key
- **THEN** app sends `GET {url}/auth/v1/settings` with header `apikey: {anonKey}`
- **AND** on success, connection config is saved to localStorage with `isActive: true`

#### Scenario: Connection check fails
- **WHEN** the settings endpoint returns an error or times out
- **THEN** error message is displayed
- **AND** user can retry or edit inputs

#### Scenario: Connection check timeout
- **WHEN** the settings endpoint does not respond within 5 seconds
- **THEN** timeout error is displayed

### Requirement: OAuth providers loaded from settings response
After successful connection check, the app SHALL parse the `/auth/v1/settings` response to determine which OAuth providers are enabled and display a sign-in button for each.

#### Scenario: Multiple providers enabled
- **WHEN** settings response indicates Google and GitHub are enabled
- **THEN** two OAuth buttons are displayed: "Sign in with Google" and "Sign in with GitHub"

#### Scenario: No providers enabled
- **WHEN** settings response indicates no external OAuth providers are enabled
- **THEN** informational message is displayed: configure OAuth providers in Supabase Dashboard

### Requirement: Connected state displays project URL
When connected to Supabase, SetupPage SHALL display the project URL. Anon Key SHALL NOT be displayed in the connected state.

#### Scenario: Connected state shows URL only
- **WHEN** user is connected to Supabase backend
- **THEN** project URL is displayed
- **AND** Anon Key is not shown

### Requirement: Connected state with expired session shows OAuth buttons
When connected to Supabase but session is expired or missing, SetupPage SHALL display OAuth provider buttons for re-authentication.

#### Scenario: Session expired shows re-auth options
- **WHEN** user is connected to Supabase
- **AND** Supabase session is expired or missing
- **THEN** OAuth provider buttons are displayed alongside Disconnect and Go to App buttons