# fix-supabase-user-profile

## Why

When authenticating via Supabase (Google OAuth), the user's avatar and email are not displayed in the UI. `SupabaseAuthSync` only passes the token to `AuthProvider` but does not extract profile data from `session.user`, even though the data is available there. `GoogleAuthSync` handles this correctly — the contract between AuthSync components and AuthProvider is asymmetric.

## What Changes

- **MODIFIED**: `SupabaseAuthSync` — extract `email` and `avatar_url` from Supabase session and pass them via `onUserEmailUpdate` / `onUserPictureUpdate` callbacks
- **MODIFIED**: `AuthProvider` — pass profile callbacks to `SupabaseAuthSync` (matching `GoogleAuthSync` pattern)

## Goals

- G1: User avatar and email are displayed when authenticating via Supabase, same as when authenticating via Google OAuth

## Non-Goals

- NG1: Changing GoogleAuthSync logic
- NG2: Adding new profile fields (full_name, etc.)
- NG3: Changing avatar display UI components

## Users & Scenarios

- U1: User authenticating via Supabase Google OAuth — expects to see their avatar and email in the app

## Requirements

### Functional

- FR1: `SupabaseAuthSync` SHALL accept `onUserEmailUpdate` and `onUserPictureUpdate` callbacks via props
- FR2: On `SIGNED_IN` event — SHALL extract `session.user.email` and `session.user.user_metadata.avatar_url` (with fallback to `user_metadata.picture`) and pass them via callbacks
- FR3: On `INITIAL_SESSION` event — SHALL extract profile only if avatar is not cached in localStorage
- FR4: On `TOKEN_REFRESHED` event — SHALL NOT extract profile data (matching silent refresh behavior in GoogleAuthSync)
- FR5: On `signOut` — SHALL remove avatar cache from localStorage
- FR6: `AuthProvider` SHALL pass `handleUserEmailUpdate` and `handleUserPictureUpdate` to `SupabaseAuthSync`

### Non-Functional

#### Performance

- NFR-P1: Profile extraction from `session.user` requires no additional HTTP requests (data is already in the session)

## UX Acceptance Criteria

- UX1: After authenticating via Supabase Google OAuth, the user's avatar is displayed in RightFilterPanel instead of the fallback CircleUser icon
- UX2: After signOut and subsequent signIn, the avatar is loaded again

## Behavior

Scenarios are described in requirements — a separate feature file is not needed (internal logic fix without new user-facing scenarios).

## Affected IA

No changes.

## Success Metrics

- M1: User avatar is displayed during Supabase authentication (previously missing)
- M2: All existing SupabaseAuthSync tests pass
- M3: New tests cover profile extraction on SIGNED_IN, INITIAL_SESSION, and absence of extraction on TOKEN_REFRESHED

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `supabase-auth`: Add requirements for extracting and passing profile data (email, picture) from Supabase session to AuthProvider

## Impact

- `packages/client/src/app/providers/SupabaseAuthSync.tsx` — main changes
- `packages/client/src/app/providers/AuthProvider.tsx` — passing callbacks (2 lines)
- `packages/client/src/app/providers/SupabaseAuthSync.test.tsx` — test updates
