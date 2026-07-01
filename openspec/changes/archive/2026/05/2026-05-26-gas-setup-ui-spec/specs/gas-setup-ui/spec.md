## ADDED Requirements

### Requirement: SetupPage displays GAS connection section
SetupPage SHALL display a collapsible "Google Apps Script" section. The section SHALL be expandable/collapsible via a toggle button. When expanded, it SHALL show URL and Client ID input fields.

#### Scenario: GAS section visible on SetupPage
- **WHEN** user opens SetupPage with no active connection
- **THEN** "Google Apps Script" section toggle is displayed

#### Scenario: GAS section expands to show inputs
- **WHEN** user expands the GAS section
- **THEN** URL input field is displayed
- **AND** Client ID input field is displayed
- **AND** Connect button is displayed

### Requirement: GAS section has URL input with Deployment ID resolution
The GAS section SHALL contain a URL input field. `parseGasInput()` SHALL accept either a full HTTPS URL or a plain Deployment ID string. A plain string (not starting with `https://`) SHALL be resolved to `https://script.google.com/macros/s/{input}/exec`. A full URL SHALL be passed through unchanged. Whitespace SHALL be trimmed.

#### Scenario: Plain Deployment ID resolved to URL
- **WHEN** input is `AKfycbx123`
- **THEN** result is `https://script.google.com/macros/s/AKfycbx123/exec`

#### Scenario: Full URL passed through
- **WHEN** input is `https://script.google.com/macros/s/AKfycbx123/exec`
- **THEN** result is `https://script.google.com/macros/s/AKfycbx123/exec`

#### Scenario: Whitespace trimmed
- **WHEN** input is `  AKfycbx123  `
- **THEN** result is `https://script.google.com/macros/s/AKfycbx123/exec`

### Requirement: GAS section has optional Client ID input
The GAS section SHALL contain an optional Client ID input field. `parseClientId()` SHALL append `.apps.googleusercontent.com` suffix if not already present. Whitespace SHALL be trimmed.

#### Scenario: Plain Client ID gets suffix appended
- **WHEN** input is `123456789`
- **THEN** result is `123456789.apps.googleusercontent.com`

#### Scenario: Full Client ID passed through
- **WHEN** input is `123456789.apps.googleusercontent.com`
- **THEN** result is `123456789.apps.googleusercontent.com`

### Requirement: Connect button disabled when URL is empty
The Connect button SHALL be disabled when the URL input is empty or contains only whitespace. The Connect button SHALL be enabled when URL has a non-empty value (Client ID is optional).

#### Scenario: Connect disabled with empty URL
- **WHEN** GAS section is expanded
- **AND** URL field is empty
- **THEN** Connect button is disabled

#### Scenario: Connect enabled with URL filled
- **WHEN** user enters a URL value
- **THEN** Connect button is enabled

### Requirement: Connect validates via adapter ping
On Connect, the app SHALL create a temporary GAS adapter with the resolved URL and call `ping()`. A successful ping response with `ok: true` SHALL save the connection config. A ping failure or exception SHALL display an error message.

#### Scenario: Successful connection without Client ID to initialized backend
- **WHEN** user clicks Connect with a valid URL and no Client ID
- **AND** ping responds with `ok: true` and `initialized: true`
- **THEN** connection config is saved with `type: "gas"` and `isActive: true`
- **AND** app navigates to inbox

#### Scenario: Successful connection without Client ID to uninitialized backend
- **WHEN** user clicks Connect with a valid URL and no Client ID
- **AND** ping responds with `ok: true` and `initialized: false`
- **THEN** "not initialized" warning is displayed with instruction to provide Client ID
- **AND** "Back to input" button is available

#### Scenario: Successful connection with Client ID to initialized backend
- **WHEN** user clicks Connect with a valid URL and Client ID
- **AND** ping responds with `ok: true` and `initialized: true`
- **THEN** connection config is saved
- **AND** awaiting sign-in state is shown with Sign In button

#### Scenario: Successful connection with Client ID to uninitialized backend
- **WHEN** user clicks Connect with a valid URL and Client ID
- **AND** ping responds with `ok: true` and `initialized: false`
- **THEN** awaiting sign-in state is shown
- **AND** after sign-in, auto-initialization is triggered

#### Scenario: Connection ping failure
- **WHEN** user clicks Connect
- **AND** ping responds with `ok: false`
- **THEN** connection error message is displayed
- **AND** user can retry

#### Scenario: Connection network error
- **WHEN** user clicks Connect
- **AND** ping throws a network error
- **THEN** connection error message is displayed
- **AND** user can retry

### Requirement: Loading states during connection and initialization
The app SHALL display a loading indicator during connection (ping) and initialization (init) phases. The Connect button SHALL be disabled during loading.

#### Scenario: Loading shown during connecting
- **WHEN** user clicks Connect
- **AND** ping is in progress
- **THEN** loading indicator is displayed
- **AND** Connect button is disabled

### Requirement: Initialization flow for uninitialized backends
When the backend is not initialized and a Client ID is provided, after sign-in the app SHALL call `adapter.init()`. A successful init SHALL navigate to inbox. A failed init SHALL display an error.

#### Scenario: Successful initialization after sign-in
- **WHEN** user signs in after connecting to uninitialized backend with Client ID
- **THEN** init is called automatically
- **AND** on success, app navigates to inbox

#### Scenario: Init failure shows error
- **WHEN** init is called and returns `ok: false`
- **THEN** init error message is displayed

### Requirement: GAS connected state displays URL and Client ID
When connected to GAS, SetupPage SHALL display the deployment URL. If a Client ID was configured, it SHALL also be displayed.

#### Scenario: Connected state shows URL
- **WHEN** user is connected to GAS at a URL
- **THEN** the URL is displayed in the connected section

#### Scenario: Connected state shows Client ID when configured
- **WHEN** user is connected to GAS with a Client ID
- **THEN** the Client ID is displayed

#### Scenario: Connected state hides Client ID section when not configured
- **WHEN** user is connected to GAS without a Client ID
- **THEN** no Client ID section is displayed

### Requirement: GAS connected state shows sign-in prompt when unauthenticated
When connected to GAS with a Client ID but no active access token, SetupPage SHALL display a sign-in prompt with a Sign In button.

#### Scenario: Sign-in prompt shown when token missing
- **WHEN** user is connected to GAS with Client ID
- **AND** no access token is present
- **THEN** sign-in required message is displayed
- **AND** Sign In button is available

#### Scenario: Sign-in prompt hidden when authenticated
- **WHEN** user is connected to GAS with Client ID
- **AND** access token is present
- **THEN** sign-in prompt is not displayed

### Requirement: GAS connected state has disconnect and navigation actions
The connected state SHALL display a Disconnect button and a "Go to App" button. Disconnect SHALL clear the connection config and return to the setup form.

#### Scenario: Disconnect clears connection
- **WHEN** user clicks Disconnect
- **THEN** connection config is cleared
- **AND** setup form is displayed

#### Scenario: Go to App navigates to inbox
- **WHEN** user clicks "Go to App"
- **THEN** app navigates to inbox
