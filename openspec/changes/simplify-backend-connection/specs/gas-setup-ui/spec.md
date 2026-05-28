## MODIFIED Requirements

### Requirement: SetupPage displays GAS connection section
Settings page Server section SHALL display a "Connect Google Apps Script" button (secondary style) when no backend is connected. Clicking it SHALL show an inline GAS connection form. The standalone `/setup` page no longer exists.

#### Scenario: Connect GAS button visible when not connected
- **WHEN** user opens Settings with no active connection
- **THEN** "Connect Google Apps Script" button is displayed in the Server section
- **AND** it appears after the "Connect Supabase" button

#### Scenario: Clicking Connect GAS shows inline form
- **WHEN** user clicks "Connect Google Apps Script"
- **THEN** an inline form with Script URL and Client ID fields is displayed
- **AND** "Connect" and "Cancel" buttons are shown

### Requirement: GAS section has optional Client ID input
The GAS section SHALL contain a **required** Client ID input field. `parseClientId()` SHALL append `.apps.googleusercontent.com` suffix if not already present. Whitespace SHALL be trimmed. The Connect button SHALL be disabled until both URL and Client ID are non-empty.

#### Scenario: Plain Client ID gets suffix appended
- **WHEN** input is `123456789`
- **THEN** result is `123456789.apps.googleusercontent.com`

#### Scenario: Full Client ID passed through
- **WHEN** input is `123456789.apps.googleusercontent.com`
- **THEN** result is `123456789.apps.googleusercontent.com`

#### Scenario: Connect disabled without Client ID
- **WHEN** GAS form is displayed
- **AND** Client ID field is empty
- **THEN** Connect button is disabled

#### Scenario: Connect disabled without URL
- **WHEN** GAS form is displayed
- **AND** URL field is empty
- **THEN** Connect button is disabled

#### Scenario: Connect enabled with both fields filled
- **WHEN** user enters values in both URL and Client ID fields
- **THEN** Connect button is enabled

### Requirement: Cancel returns to backend selection
Clicking "Cancel" in the GAS form SHALL return the Server section to the backend selection view.

#### Scenario: Cancel returns to selection
- **WHEN** user is viewing the GAS connection form
- **AND** user clicks "Cancel"
- **THEN** the form is hidden
- **AND** backend selection buttons are displayed

### Requirement: Connect button disabled when URL is empty
The Connect button SHALL be disabled when either the URL input or Client ID input is empty or contains only whitespace.

#### Scenario: Connect disabled with empty URL
- **WHEN** GAS form is displayed
- **AND** URL field is empty
- **THEN** Connect button is disabled

#### Scenario: Connect enabled with both fields filled
- **WHEN** user enters a URL and Client ID value
- **THEN** Connect button is enabled

### Requirement: Connect validates via adapter ping
On Connect, the app SHALL create a temporary GAS adapter with the resolved URL and call `ping()`. A successful ping SHALL save the connection config and transition to awaiting-signin phase (Client ID is always present).

#### Scenario: Successful connection with Client ID to initialized backend
- **WHEN** user clicks Connect with valid URL and Client ID
- **AND** ping responds with `ok: true` and `initialized: true`
- **THEN** connection config is saved
- **AND** "Sign in with Google" button is displayed inline

#### Scenario: Successful connection with Client ID to uninitialized backend
- **WHEN** user clicks Connect with valid URL and Client ID
- **AND** ping responds with `ok: true` and `initialized: false`
- **THEN** "Sign in with Google" button is displayed
- **AND** after sign-in, auto-initialization is triggered

#### Scenario: Connection ping failure
- **WHEN** user clicks Connect
- **AND** ping responds with `ok: false`
- **THEN** connection error message is displayed inline
- **AND** user can retry

#### Scenario: Connection network error
- **WHEN** user clicks Connect
- **AND** ping throws a network error
- **THEN** connection error message is displayed inline
- **AND** user can retry

### Requirement: Loading states during connection and initialization
The app SHALL display a loading indicator during connection (ping) and initialization (init) phases. The Connect button SHALL be disabled during loading.

#### Scenario: Loading shown during connecting
- **WHEN** user clicks Connect
- **AND** ping is in progress
- **THEN** loading indicator is displayed
- **AND** Connect button is disabled

### Requirement: Initialization flow for uninitialized backends
When the backend is not initialized, after sign-in the app SHALL call `adapter.init()`. A successful init SHALL transition to connected state. A failed init SHALL display an error.

#### Scenario: Successful initialization after sign-in
- **WHEN** user signs in after connecting to uninitialized backend
- **THEN** init is called automatically
- **AND** on success, Server section shows connected state

#### Scenario: Init failure shows error
- **WHEN** init is called and returns `ok: false`
- **THEN** init error message is displayed inline

### Requirement: Cancel from GAS sign-in returns to GAS form
Clicking "Cancel" on the "Sign in with Google" phase SHALL call `disconnect()` to clear the saved config and return to the GAS connection form.

#### Scenario: Cancel from GAS sign-in disconnects and returns to form
- **WHEN** user is viewing "Sign in with Google" after successful GAS ping
- **AND** user clicks "Cancel"
- **THEN** connection config is cleared (disconnect)
- **AND** GAS connection form is displayed

### Requirement: GAS connected state displays URL and Client ID
When connected to GAS, the Server section SHALL display the backend type ("Google Apps Script") and deployment URL. Client ID is always present (required field).

#### Scenario: Connected state shows type and URL
- **WHEN** user is connected to GAS
- **THEN** Server section displays "Google Apps Script" label and URL

### Requirement: GAS connected state shows sign-in prompt when unauthenticated
When connected to GAS but no active access token exists, the Server section SHALL display a sign-in prompt with a "Sign in with Google" button.

#### Scenario: Sign-in prompt shown when token missing
- **WHEN** user is connected to GAS with Client ID
- **AND** no access token is present
- **THEN** sign-in required message is displayed
- **AND** "Sign in with Google" button is available

#### Scenario: Sign-in prompt hidden when authenticated
- **WHEN** user is connected to GAS with Client ID
- **AND** access token is present
- **THEN** sign-in prompt is not displayed

### Requirement: GAS connected state has disconnect and full sync actions
The connected state SHALL display a "Disconnect" button and a "Full sync" button. Disconnect SHALL clear the connection and return to backend selection. "Go to App" button is removed (user is already in the app on Settings page).

#### Scenario: Disconnect clears connection
- **WHEN** user clicks Disconnect and confirms
- **THEN** connection config is cleared
- **AND** backend selection is displayed

#### Scenario: Full sync triggers synchronization
- **WHEN** user clicks "Full sync" and confirms
- **THEN** full synchronization is triggered

## REMOVED Requirements

### Requirement: GAS connected state has disconnect and navigation actions
**Reason**: "Go to App" button is unnecessary — user is already in the app. Replaced by "Full sync" and "Disconnect" in Settings.
**Migration**: Full sync and Disconnect buttons in ServerConnectedStatus component.
