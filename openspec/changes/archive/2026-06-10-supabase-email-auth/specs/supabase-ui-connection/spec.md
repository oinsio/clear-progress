## MODIFIED Requirements

### Requirement: OAuth providers loaded from settings response

After successful connection check, the app SHALL parse the `/auth/v1/settings` response to determine which OAuth providers are enabled and whether email auth is enabled. The result SHALL be returned as `{ oauthProviders: string[], isEmailEnabled: boolean }`. OAuth provider buttons SHALL be displayed for each enabled provider. If `isEmailEnabled` is `true`, an email input form SHALL also be displayed (see `email-otp-auth` capability).

#### Scenario: Multiple providers enabled with email
- **WHEN** settings response indicates Google and GitHub are enabled
- **AND** email auth is enabled
- **THEN** two OAuth buttons are displayed: "Sign in with Google" and "Sign in with GitHub"
- **AND** email input form is displayed below a divider

#### Scenario: Only email enabled, no OAuth providers
- **WHEN** settings response indicates no OAuth providers are enabled
- **AND** email auth is enabled
- **THEN** no OAuth buttons are displayed
- **AND** no "no providers" warning is shown
- **AND** email input form is displayed

#### Scenario: No providers and no email enabled
- **WHEN** settings response indicates no OAuth providers are enabled
- **AND** email auth is disabled
- **THEN** informational message is displayed: configure auth providers in Supabase Dashboard

#### Scenario: OAuth providers enabled, email disabled
- **WHEN** settings response indicates GitHub is enabled
- **AND** email auth is disabled
- **THEN** one OAuth button is displayed
- **AND** no email input form or divider is shown

## ADDED Requirements

### Requirement: State machine supports email OTP phase

`ServerSection` SHALL support a `supabase_email_otp` phase. This phase is entered when the user submits an email for OTP authentication. The phase SHALL store the submitted email address. From this phase, the user can verify OTP (leading to `connected` via `onAuthStateChange`), go back to `supabase_providers`, or be redirected via magic link.

#### Scenario: Transition to email OTP phase
- **WHEN** user submits email on providers screen
- **AND** `signInWithOtp` succeeds
- **THEN** `ServerSection` transitions to `supabase_email_otp` phase
- **AND** the email address is stored for the OTP verification screen

#### Scenario: Back from email OTP returns to providers
- **WHEN** user is in `supabase_email_otp` phase
- **AND** user clicks "Back"
- **THEN** `ServerSection` transitions to `supabase_providers` phase
- **AND** connection config remains active
