## MODIFIED Requirements

### Requirement: SetupPage displays Supabase connection section
Settings page Server section SHALL display a "Connect Supabase" button (primary style) when no backend is connected. Clicking it SHALL show an inline Supabase connection form. The standalone `/setup` page no longer exists.

#### Scenario: Connect Supabase button visible when not connected
- **WHEN** user opens Settings with no active connection
- **THEN** "Connect Supabase" button is displayed in the Server section
- **AND** it appears before the "Connect Google Apps Script" button

#### Scenario: Clicking Connect Supabase shows inline form
- **WHEN** user clicks "Connect Supabase"
- **THEN** an inline form with Project URL and Anon Key fields is displayed
- **AND** "Connect" and "Cancel" buttons are shown

### Requirement: Supabase section has URL and Anon Key inputs
The Supabase connection form SHALL contain two input fields: Project URL (`type="text"`) and Anon Key (`type="text"`, not password — it is a public key). The Connect button SHALL be disabled until both fields have non-empty values.

#### Scenario: Empty inputs disable Connect
- **WHEN** Supabase form is displayed
- **AND** either URL or Anon Key field is empty
- **THEN** Connect button is disabled

#### Scenario: Both fields filled enables Connect
- **WHEN** user enters a value in both URL and Anon Key fields
- **THEN** Connect button is enabled

#### Scenario: Anon Key input is plain text
- **WHEN** Supabase form is displayed
- **THEN** Anon Key input has `type="text"` (not `type="password"`)

### Requirement: Cancel returns to backend selection
Clicking "Cancel" in the Supabase form SHALL return the Server section to the backend selection view with "Connect Supabase" and "Connect GAS" buttons.

#### Scenario: Cancel returns to selection
- **WHEN** user is viewing the Supabase connection form
- **AND** user clicks "Cancel"
- **THEN** the form is hidden
- **AND** backend selection buttons are displayed

### Requirement: Connect validates via /auth/v1/settings
On Connect, the app SHALL send `GET /auth/v1/settings` with the `apikey` header set to the provided Anon Key. A successful response validates the URL and Anon Key combination.

#### Scenario: Successful connection check
- **WHEN** user clicks Connect with valid URL and Anon Key
- **THEN** app sends `GET {url}/auth/v1/settings` with header `apikey: {anonKey}`
- **AND** on success, connection config is saved to localStorage with `isActive: true`

#### Scenario: Connection check fails
- **WHEN** the settings endpoint returns an error or times out
- **THEN** error message is displayed inline in the Server section
- **AND** user can retry or edit inputs

#### Scenario: Connection check timeout
- **WHEN** the settings endpoint does not respond within 5 seconds
- **THEN** timeout error is displayed

### Requirement: OAuth providers loaded from settings response
After successful connection check, the app SHALL parse the `/auth/v1/settings` response to determine which OAuth providers are enabled and display a sign-in button for each inline in the Server section.

#### Scenario: Multiple providers enabled
- **WHEN** settings response indicates Google and GitHub are enabled
- **THEN** two OAuth buttons are displayed: "Sign in with Google" and "Sign in with GitHub"

#### Scenario: No providers enabled
- **WHEN** settings response indicates no external OAuth providers are enabled
- **THEN** informational message is displayed: configure OAuth providers in Supabase Dashboard

### Requirement: Connected state displays project URL in Settings
When connected to Supabase, the Server section SHALL display the backend type label ("Supabase") and project URL. Anon Key SHALL NOT be displayed in the connected state.

#### Scenario: Connected state shows type and URL
- **WHEN** user is connected to Supabase backend
- **THEN** Server section displays "Supabase" label and project URL
- **AND** Anon Key is not shown

### Requirement: Connected state with expired session shows OAuth buttons
When connected to Supabase but session is expired or missing, the Server section SHALL display OAuth provider buttons for re-authentication.

#### Scenario: Session expired shows re-auth options
- **WHEN** user is connected to Supabase
- **AND** Supabase session is expired or missing
- **THEN** OAuth provider buttons are displayed alongside Full sync and Disconnect buttons

## REMOVED Requirements

### Requirement: SetupPage displays Supabase connection section
**Reason**: The standalone SetupPage with collapsible accordion sections is removed. Supabase connection is now inline in Settings page Server section.
**Migration**: All Supabase connection UI is in `components/settings/ServerSection.tsx` and sub-components.
