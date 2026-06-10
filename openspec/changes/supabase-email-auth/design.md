## Context

The app currently supports Supabase authentication exclusively through OAuth providers (Google, GitHub, etc.). The OAuth flow relies on `signInWithOAuth` which redirects the user to an external provider. Email auth is detected by the `/auth/v1/settings` endpoint but actively filtered out in `supabaseConnection.ts` (`NON_OAUTH_PROVIDERS` set). The `SupabaseAuthSync` component already handles `onAuthStateChange` events for `SIGNED_IN`, `TOKEN_REFRESHED`, and `SIGNED_OUT` — these events are provider-agnostic, so email auth sessions produce identical events.

Driven by FR1–FR11 from proposal.

## Goals / Non-Goals

**Goals:**
- Add email OTP/magic link as an auth method alongside OAuth (FR1, FR2)
- Reuse existing `SupabaseAuthSync` for session handling (FR5)
- Minimal state machine changes — one new phase (FR3, FR9)

**Non-Goals:**
- Email+password flow (NG1)
- Custom email templates (NG3)
- Changes to adapter or sync layer

## Decisions

### D1: Return structured auth methods from `fetchSupabaseProviders`

**Decision**: Change return type from `string[]` to `{ oauthProviders: string[], isEmailEnabled: boolean }`.

**Why**: Email is not an OAuth provider and requires different UI treatment (input field vs button). A boolean flag is cleaner than mixing email into the providers array and filtering later.

**Alternative considered**: Return email in the `string[]` array and let the UI filter — rejected because it spreads provider-type logic across multiple components.

### D2: Email form embedded in `ServerOAuthProviders` (Variant A)

**Decision**: Add email input directly within the existing `ServerOAuthProviders` component, below OAuth buttons, separated by an "or" divider.

**Why**: User sees all authentication options at once — no extra navigation step. Keeps the component count low.

**Alternative considered**: Email as a separate button leading to a new screen (Variant B) — rejected as it adds an unnecessary navigation step for a simple email input.

### D3: Single text input for OTP verification

**Decision**: Use one `<input>` with `inputMode="numeric"` and no `maxLength` restriction instead of separate digit fields. Verify button is enabled when any characters are entered.

**Why**: Simpler implementation, better auto-paste support on mobile (single field receives full OTP from clipboard), fewer accessibility concerns. Matches mobile OS autofill behavior. OTP code length is configured server-side (`GOTRUE_MAILER_OTP_LENGTH`, default 6, range 6–10) and is not exposed via public API, so the client does not restrict input length.

**Alternative considered**: Separate digit inputs with auto-advance — rejected due to complexity and worse mobile auto-paste UX. Hardcoded `maxLength` — rejected because OTP length varies per Supabase project configuration.

### D4: `supabase_email_otp` as a new phase in `ServerSection`

**Decision**: Add one new phase to the `ServerPhase` union type. The phase stores the email address for display and resend.

**Why**: Follows existing pattern — each distinct UI screen is a phase. The OTP screen has different controls than the providers screen, justifying a separate phase.

**State transitions**:
```
supabase_providers ──(send email)──▶ supabase_email_otp
supabase_email_otp ──(verify OK)───▶ connected (via onAuthStateChange)
supabase_email_otp ──(back)────────▶ supabase_providers
supabase_email_otp ──(magic link)──▶ connected (via redirect + onAuthStateChange)
```

### D5: Resend cooldown managed locally with `useState` + `useEffect`

**Decision**: Track cooldown with a `remainingSeconds` state and a `setInterval` that decrements it. No server-side cooldown tracking.

**Why**: Supabase enforces its own rate limit (1 email per 60 seconds per email address). The client-side timer is purely UX — prevents unnecessary failed requests. If the user refreshes, the timer resets, but Supabase's server-side limit still applies.

### D6: No changes to `SupabaseAuthSync` or `AuthProvider`

**Decision**: Both magic link and OTP verification produce standard Supabase `SIGNED_IN` events with identical session structure. `SupabaseAuthSync.onAuthStateChange` already handles this. The `app_metadata.provider` for email auth is `"email"` — already handled by the generic provider extraction logic.

The current `doSignIn` in `SupabaseAuthSync` hardcodes `signInWithOAuth({ provider: "google" })` — this is only used via `signInRef` which is not called for email flow (email sign-in is handled directly in `ServerSection`). No change needed.

## Risks / Trade-offs

**[Risk] Supabase email sending limits** → Supabase free tier has email sending limits (4 emails/hour for auth). This is a Supabase platform constraint, not something we can mitigate in code. Users on free tier may hit limits. Mitigation: the 60-second cooldown reduces unnecessary sends.

**[Risk] Magic link redirect URL must be whitelisted** → Supabase requires `emailRedirectTo` URLs to be in the project's "Redirect URLs" allowlist. If not configured, magic link clicks will fail silently. Mitigation: document this in setup instructions; OTP path always works regardless.

**[Trade-off] `ServerOAuthProviders` name becomes misleading** → The component will now handle both OAuth and email auth. Renaming to `ServerAuthMethods` would be cleaner but increases change scope. Decision: keep current name, add a code comment noting it handles email too.
