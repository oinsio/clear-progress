## ADDED Requirements

### Requirement: Email auth sessions handled by SupabaseAuthSync

Email-based authentication (OTP verification and magic link) SHALL produce standard Supabase `SIGNED_IN` events with session objects identical in structure to OAuth sessions. `SupabaseAuthSync` SHALL handle these events without modification. The `session.user.app_metadata.provider` for email auth SHALL be `"email"`, which is already handled by the generic provider extraction logic.

#### Scenario: Email OTP session produces SIGNED_IN event
- **WHEN** user verifies OTP code successfully
- **THEN** Supabase SDK fires `SIGNED_IN` event
- **AND** session contains `access_token`, `expires_in`, `user.email`, and `user.app_metadata.provider = "email"`
- **AND** `SupabaseAuthSync` calls `onTokenUpdate`, `onUserEmailUpdate`, and `onAuthProviderUpdate("email")`

#### Scenario: Magic link session produces SIGNED_IN event
- **WHEN** user clicks magic link and returns to app
- **THEN** Supabase SDK fires `SIGNED_IN` event
- **AND** session contains `access_token`, `expires_in`, `user.email`, and `user.app_metadata.provider = "email"`
- **AND** `SupabaseAuthSync` calls `onTokenUpdate`, `onUserEmailUpdate`, and `onAuthProviderUpdate("email")`

#### Scenario: Email auth user has no avatar
- **WHEN** user authenticates via email
- **AND** `session.user.user_metadata` does not contain `avatar_url` or `picture`
- **THEN** `SupabaseAuthSync` calls `onUserPictureUpdate(null)`

### Requirement: ProviderIcon supports email provider

`ProviderIcon` SHALL render a `Mail` icon from `lucide-react` when `provider` is `"email"`. The icon SHALL use `aria-hidden="true"` consistent with other provider icons.

#### Scenario: Email provider renders mail icon
- **WHEN** `provider` is `"email"`
- **THEN** `Mail` icon from lucide-react is rendered with `aria-hidden="true"`
