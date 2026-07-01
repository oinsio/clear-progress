## MODIFIED Requirements

### Requirement: Connection test connects via Settings page
Integration tests SHALL connect to Supabase via the Settings page Server section instead of the standalone `/setup` page.

#### Scenario: Connect with valid URL and anon key via Settings
- **WHEN** test navigates to `/settings`
- **AND** clicks "Connect Supabase" button
- **AND** fills Project URL and Anon Key fields
- **AND** clicks "Connect"
- **THEN** OAuth provider buttons or "no providers" message is visible

#### Scenario: Connect with invalid URL via Settings shows error
- **WHEN** test navigates to `/settings`
- **AND** clicks "Connect Supabase" button
- **AND** fills invalid URL and some anon key
- **AND** clicks "Connect"
- **THEN** error message is visible in the Server section

### Requirement: Auth setup authenticates via Settings page
The shared auth setup SHALL connect and authenticate via the Settings page Server section. After OAuth sign-in, the app SHALL navigate to `/tasks` (inbox).

#### Scenario: Full auth flow via Settings
- **WHEN** auth setup navigates to `/settings`
- **AND** clicks "Connect Supabase"
- **AND** fills URL and Anon Key
- **AND** clicks "Connect"
- **AND** clicks the OAuth provider button
- **AND** completes mock OAuth sign-in
- **THEN** app navigates to `/tasks`
- **AND** access token is present in localStorage
- **AND** initial sync completes
