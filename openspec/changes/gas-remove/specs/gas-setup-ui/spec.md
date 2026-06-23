## REMOVED Requirements

### Requirement: GAS URL input form
**Reason**: GAS backend removed. No need for GAS Script URL and Client ID input UI.
**Migration**: Users connect via Supabase setup flow only.

### Requirement: GAS URL parsing and validation
**Reason**: GAS backend removed.
**Migration**: None needed.

### Requirement: Google Sign-In button for GAS
**Reason**: GAS backend removed. Google OAuth via `@react-oauth/google` is no longer needed.
**Migration**: Supabase OAuth handles Google sign-in via `supabase.auth.signInWithOAuth()`.
