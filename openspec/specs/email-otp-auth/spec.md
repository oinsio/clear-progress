# Capability: Email OTP Auth

## Purpose

Email-based authentication flow using Supabase OTP: email input with validation, OTP code sending, verification screen with resend cooldown, and magic link fallback.

## Requirements

### Requirement: Email input on providers screen when email auth is enabled

When `isEmailEnabled` is `true` in the auth methods response, an email input field SHALL appear below the OAuth provider buttons, separated by an "or" divider. The email input SHALL have `type="email"` for HTML5 validation and a client-side pattern check (`local@domain.tld` with TLD >= 2 characters). A "Send code" button SHALL be displayed next to or below the email input. The button SHALL be disabled when the email field is empty or contains an invalid email address.

#### Scenario: Email input visible when email auth enabled
- **WHEN** Supabase project has email auth enabled
- **AND** providers screen is displayed
- **THEN** an "or" divider appears below OAuth buttons
- **AND** an email input field with `type="email"` is displayed
- **AND** a "Send code" button is displayed

#### Scenario: Email input hidden when email auth disabled
- **WHEN** Supabase project has email auth disabled
- **AND** providers screen is displayed
- **THEN** no email input or divider is shown
- **AND** only OAuth buttons are displayed

#### Scenario: Send button disabled when email empty
- **WHEN** email input is empty
- **THEN** "Send code" button is disabled

#### Scenario: Send button disabled when email is invalid
- **WHEN** user enters text that is not a valid email (e.g., "not-an-email", "user@", "user@example.c")
- **THEN** "Send code" button is disabled

#### Scenario: Send button enabled when email is valid
- **WHEN** user enters a valid email address (e.g., "user@example.com")
- **THEN** "Send code" button is enabled

### Requirement: Send OTP via signInWithOtp

Clicking "Send code" SHALL call `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } })` where `emailRedirectTo` points to the Settings page. On success, the UI SHALL transition to the OTP verification screen. On failure, an error message SHALL be displayed inline.

#### Scenario: OTP sent successfully
- **WHEN** user enters `user@example.com` and clicks "Send code"
- **THEN** `signInWithOtp` is called with the email and `shouldCreateUser: true`
- **AND** UI transitions to OTP verification screen
- **AND** the entered email is preserved for display and resend

#### Scenario: OTP send fails with network error
- **WHEN** user clicks "Send code"
- **AND** network request fails
- **THEN** error message is displayed on the providers screen
- **AND** user can retry

#### Scenario: Loading state while sending OTP
- **WHEN** user clicks "Send code"
- **AND** request is in progress
- **THEN** loading indicator is shown
- **AND** "Send code" button is disabled

### Requirement: OTP verification screen

The OTP verification screen SHALL display: the email address the code was sent to, a single text input with `inputMode="numeric"` (no `maxLength` — OTP length is configured server-side), a "Verify" button, a hint about the magic link alternative, and a "Back" button.

#### Scenario: OTP screen displays email and input
- **WHEN** OTP verification screen is shown
- **THEN** the email address is displayed as confirmation text
- **AND** a single text input for the OTP code is displayed with `inputMode="numeric"`
- **AND** a "Verify" button is displayed
- **AND** a hint "We also sent a magic link to your email" is displayed

#### Scenario: Verify button disabled when code incomplete
- **WHEN** OTP input is empty
- **THEN** "Verify" button is disabled

#### Scenario: Verify button enabled when code entered
- **WHEN** OTP input contains any characters
- **THEN** "Verify" button is enabled

### Requirement: Verify OTP code

Clicking "Verify" SHALL call `supabase.auth.verifyOtp({ email, token, type: "email" })`. On success, `onAuthStateChange` fires `SIGNED_IN` which is handled by existing `SupabaseAuthSync`. On failure, an error message SHALL be displayed and the input SHALL be cleared for retry.

#### Scenario: OTP verification succeeds
- **WHEN** user enters correct OTP code and clicks "Verify"
- **THEN** `verifyOtp` is called with the email, token, and `type: "email"`
- **AND** Supabase SDK fires `SIGNED_IN` event
- **AND** `SupabaseAuthSync` handles the event (existing behavior)

#### Scenario: OTP verification fails with invalid code
- **WHEN** user enters incorrect code and clicks "Verify"
- **THEN** error message "Invalid or expired code" is displayed
- **AND** OTP input is cleared
- **AND** user can enter a new code

#### Scenario: Loading state while verifying
- **WHEN** user clicks "Verify"
- **AND** verification is in progress
- **THEN** loading indicator is shown
- **AND** "Verify" button is disabled

### Requirement: Resend OTP with cooldown timer

A "Resend" button SHALL be displayed on the OTP verification screen. After sending an OTP, the Resend button SHALL be disabled for 60 seconds with a countdown display. After the cooldown, clicking Resend SHALL call `signInWithOtp` again with the same email.

#### Scenario: Resend disabled during cooldown
- **WHEN** OTP was just sent
- **THEN** Resend button shows "Resend (0:59)" and is disabled
- **AND** countdown decrements every second

#### Scenario: Resend enabled after cooldown
- **WHEN** 60 seconds have elapsed since last OTP send
- **THEN** Resend button shows "Resend" and is enabled

#### Scenario: Resend sends new OTP
- **WHEN** cooldown has elapsed
- **AND** user clicks "Resend"
- **THEN** `signInWithOtp` is called with the same email
- **AND** cooldown timer resets to 60 seconds

### Requirement: Back button returns to providers screen

Clicking "Back" on the OTP verification screen SHALL return to the providers screen WITHOUT calling `disconnect()`. The Supabase connection remains active.

#### Scenario: Back returns to providers
- **WHEN** user is on OTP verification screen
- **AND** user clicks "Back"
- **THEN** providers screen is displayed with OAuth buttons and email input
- **AND** connection config is NOT cleared

### Requirement: Magic link handled by existing SupabaseAuthSync

When the user clicks a magic link in the email, the browser navigates to the app's Settings page with auth tokens in the URL hash. The existing `SupabaseAuthSync` component handles the `SIGNED_IN` event from `onAuthStateChange` automatically. No new code is required for this path.

#### Scenario: Magic link redirects and authenticates
- **WHEN** user clicks magic link in email
- **THEN** browser navigates to Settings page with token in URL hash
- **AND** Supabase SDK parses the hash and creates a session
- **AND** `onAuthStateChange` fires `SIGNED_IN`
- **AND** `SupabaseAuthSync` processes the event (existing behavior)
