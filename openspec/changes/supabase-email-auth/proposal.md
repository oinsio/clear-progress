# Supabase Email Auth

## Why

Google OAuth for Supabase requires complex setup (Google Cloud Console, verified domain, consent screen). GitHub OAuth is easy but not all users have GitHub accounts. Email authentication (Magic Link + OTP) is built into every Supabase project by default — no external provider configuration needed. This gives all users an immediate way to authenticate.

## What Changes

- **ADDED**: Email input field on the OAuth providers screen (alongside existing OAuth buttons)
- **ADDED**: OTP verification screen with single text input for 6-digit code
- **ADDED**: Resend cooldown timer (60 seconds) on OTP screen
- **MODIFIED**: `fetchSupabaseProviders` returns `isEmailEnabled` flag separately from OAuth providers
- **MODIFIED**: `ServerSection` state machine gains `supabase_email_otp` phase
- **MODIFIED**: `SupabaseAuthSync.doSignIn` currently hardcodes `provider: "google"` — no longer used as sole sign-in path

## Capabilities

### New Capabilities

- `email-otp-auth`: Email-based authentication flow — sending OTP via `signInWithOtp`, verifying code via `verifyOtp`, magic link handling, resend cooldown

### Modified Capabilities

- `supabase-ui-connection`: OAuth providers screen now includes email input and divider; new `supabase_email_otp` phase added to state machine
- `supabase-auth`: `SupabaseAuthSync` sign-in refs are no longer solely OAuth-based; email auth sessions produce the same `onAuthStateChange` events

## Goals

- G1: Allow users to authenticate with Supabase using only an email address
- G2: Zero additional Supabase configuration required (email auth is enabled by default)

## Non-Goals

- NG1: Email + password authentication (signup/login with password, forgot password flow)
- NG2: Phone/SMS OTP authentication
- NG3: Custom email templates (use Supabase default templates)
- NG4: Email verification for existing OAuth users

## Users & Scenarios

- U1: New user without GitHub/Google account — enters email, receives OTP, enters code, gets authenticated
- U2: New user — enters email, receives magic link, clicks link, gets redirected back and authenticated
- U3: Returning user — enters email on OTP screen, receives code, enters code, session restored
- U4: User on mobile — prefers OTP code over magic link (no app switching)

## Requirements

### Functional

- FR1: When email auth is enabled on Supabase project, an email input field SHALL appear below OAuth buttons on the providers screen, separated by a divider
- FR2: Submitting email SHALL call `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } })` and transition to OTP verification screen
- FR3: OTP verification screen SHALL display the email address, a single text input (`inputMode="numeric"`, `maxLength={6}`), a Verify button, and a Back button
- FR4: Submitting OTP code SHALL call `supabase.auth.verifyOtp({ email, token, type: "email" })` and on success the existing `onAuthStateChange` handler transitions to connected state
- FR5: Magic link click SHALL redirect to the app's settings page where `SupabaseAuthSync` handles the `SIGNED_IN` event automatically (no new code needed)
- FR6: Resend button SHALL be disabled for 60 seconds after sending OTP, showing a countdown timer
- FR7: After cooldown, clicking Resend SHALL call `signInWithOtp` again with the same email
- FR8: `fetchSupabaseProviders` SHALL return `{ oauthProviders: string[], isEmailEnabled: boolean }` instead of `string[]`
- FR9: Back button on OTP screen SHALL return to providers screen without disconnecting
- FR10: OTP verification errors SHALL be displayed inline on the verification screen
- FR11: Email input SHALL validate format before sending (HTML5 `type="email"` validation)

### Non-Functional

#### Accessibility — NFR-A1
- Email input and OTP input SHALL have associated `<label>` elements
- Error messages SHALL use `role="alert"` and `aria-live="polite"`
- Countdown timer SHALL use `aria-live="polite"` for screen reader updates
- All interactive elements SHALL be keyboard-accessible

#### Responsive — NFR-R1
- Email form and OTP screen SHALL work on viewports from 320px width
- Layout SHALL be consistent with existing ServerOAuthProviders component

## UX Acceptance Criteria

- UX1: Email input appears below OAuth buttons with an "or" divider — user sees all auth options at once
- UX2: After sending OTP, user sees clear confirmation with their email address and hint about magic link
- UX3: Countdown timer shows remaining seconds in "Resend (0:45)" format
- UX4: Loading state shown while sending OTP and while verifying code
- UX5: Error messages are specific: invalid code, expired code, rate limit, network error

## UI States Matrix

| State             | Network | Data                            | UI                                          |
|-------------------|---------|---------------------------------|---------------------------------------------|
| Email input idle  | online  | providers loaded, email enabled | Email field + Send button enabled           |
| Sending OTP       | online  | email entered                   | Loading spinner, Send button disabled       |
| OTP sent          | online  | email stored                    | OTP input, Verify button, countdown timer   |
| Verifying OTP     | online  | code entered                    | Loading spinner, Verify button disabled     |
| OTP error         | online  | invalid/expired code            | Error message, OTP input cleared, can retry |
| Resend cooldown   | online  | timer active                    | Resend button disabled with countdown       |
| Network error     | offline | any                             | Error message, retry available              |
| Magic link return | online  | token in URL hash               | Auto-handled by SupabaseAuthSync            |

## Behavior

Scenarios defined in:
- `features/email-otp-auth.feature` (@supabase-email-auth tags)

## Visual Reference

No Figma. Follows existing design patterns from `ServerOAuthProviders` and `ServerSupabaseForm`. Design tokens are source of truth.

## Affected IA

No IA changes — email auth is integrated into existing Settings > Server section flow.

## Success Metrics

- M1: User can authenticate via email OTP without any OAuth provider configured on Supabase project
- M2: Magic link flow works without additional code (verified by existing SupabaseAuthSync tests)
- M3: Mutation testing score >= 95% on new code
- M4: All new components pass axe-core accessibility checks

## Open Questions

None.
