## Context

`GoogleAuthSync` and `SupabaseAuthSync` are two renderless components that synchronize OAuth state with `AuthProvider`. `GoogleAuthSync` passes three types of data: token, email, and avatar. `SupabaseAuthSync` passes only the token. The contract between AuthSync and AuthProvider is asymmetric.

Profile data is available from different sources:
- Google: requires a separate `fetch(GOOGLE_USERINFO_URL)` — the token response does not contain profile data
- Supabase: `session.user.email` and `session.user.user_metadata.avatar_url` — data is already in the session

## Goals / Non-Goals

**Goals:**
- Unify the AuthSync → AuthProvider contract: both components pass token + email + picture
- Use data from `session.user` without additional HTTP requests (FR1-FR6, NFR-P1)

**Non-Goals:**
- Creating an abstract AuthSync interface (NG1 — components differ too much in mechanism)
- Changing GoogleAuthSync (NG1)

## Decisions

### D1: Extract profile from session.user, not via Supabase API

**Decision**: Read `session.user.email` and `session.user.user_metadata.avatar_url` directly from the session object in `onAuthStateChange`.

**Alternative**: Call `supabase.auth.getUser()` to get up-to-date data from the server.

**Rationale**: `session.user` already contains all needed fields; an additional request would increase latency and add a failure point. GoogleAuthSync is forced to fetch only because the Google token response does not contain profile data.

### D2: Extraction strategy by event type

**Decision**: Mirror GoogleAuthSync logic — extract profile only on explicit login, not on token refresh:
- `SIGNED_IN` → always extract email + picture
- `INITIAL_SESSION` → extract only if no cache in localStorage
- `TOKEN_REFRESHED` → do not extract

**Rationale**: Matches the GoogleAuthSync pattern (`isSilentRef.current` → skip). Minimizes unnecessary state updates.

### D3: Fallback avatar_url → picture

**Decision**: Check `user_metadata.avatar_url` first, then `user_metadata.picture`.

**Rationale**: Supabase may place the avatar URL in different fields depending on the OAuth provider. Google OAuth via Supabase uses `avatar_url`, but some configurations duplicate it in `picture`.

## Risks / Trade-offs

- **[Risk]** `user_metadata` may not contain `avatar_url` for non-standard OAuth providers → **Mitigation**: fallback to `picture`, graceful fallback to CircleUser icon in UI (already implemented)
- **[Trade-off]** Avatar is cached in localStorage and not updated on TOKEN_REFRESHED → acceptable since avatars change very rarely; will be updated on next SIGNED_IN
