## Context

ServerConnectedStatus currently shows backend type, URL, and user email for Supabase connections. The OAuth provider used for authentication (Google, GitHub, etc.) is available in `session.user.app_metadata.provider` but not extracted or displayed. This change threads provider info through the existing auth data flow and adds a visual row with provider icon.

Driven by FR1–FR10 from proposal.

## Goals / Non-Goals

**Goals:**
- Thread `authProvider` from Supabase session through AuthProvider context to UI
- Display provider name with recognizable icon in ServerConnectedStatus
- Reuse existing patterns (callback props in SupabaseAuthSync, context field in AuthProvider)

**Non-Goals:**
- Changing the GAS auth flow or displaying provider for GAS connections
- Adding a new icon library dependency

## Decisions

### D1: Provider data flows through AuthProvider context (not local state)

**Decision**: Add `authProvider: string | null` to `AuthContextValue` and extract it in `SupabaseAuthSync` via a new `onAuthProviderUpdate` callback — same pattern as `onUserEmailUpdate`.

**Alternative**: Read provider directly in `ServerConnectedStatus` via `getSupabaseClient().auth.getSession()`. Rejected because it breaks the unidirectional data flow pattern and creates a direct dependency on Supabase SDK in a UI component.

**Rationale**: Consistent with how `userEmail` and `userPicture` are already propagated (FR4, FR5).

### D2: Icon mapping as a standalone component

**Decision**: Create `ProviderIcon` component in `components/settings/` that maps provider string to icon. Uses a Record-based lookup: lucide icons for known providers, inline SVG components for Google and Microsoft, returns `null` for unknown.

**Alternative**: Inline the mapping in ServerConnectedStatus. Rejected because the icon mapping has its own test surface (FR9, FR10) and would bloat the connected status component.

**Rationale**: Keeps ServerConnectedStatus focused on layout. ProviderIcon is independently testable.

### D3: Inline SVG for Google and Microsoft only

**Decision**: Create small React components with inline SVG for Google and Microsoft logos (~10 lines each). All other brand icons come from lucide-react (already a project dependency).

**Alternative**: Add `simple-icons` or `react-icons` package. Rejected — adding a dependency for 2 icons is overkill.

**Rationale**: Minimizes bundle impact. Google and Microsoft are the only commonly-used Supabase providers missing from lucide-react (FR9).

### D4: Provider extraction only on SIGNED_IN and INITIAL_SESSION

**Decision**: Extract `app_metadata.provider` only on `SIGNED_IN` and `INITIAL_SESSION` events, same as email extraction. Skip on `TOKEN_REFRESHED` — provider does not change during a session.

**Rationale**: Matches existing pattern in SupabaseAuthSync for email/avatar (FR1, FR2).

### D5: Reuse ProviderIcon in OAuth sign-in buttons

**Decision**: Import `ProviderIcon` into `ServerOAuthProviders` and render it inside each provider button alongside the capitalized name. The same component and icon mapping is used in both ServerConnectedStatus (provider row) and ServerOAuthProviders (sign-in buttons).

**Alternative**: Create separate icon components for buttons vs. info rows. Rejected — same providers, same icons, no reason to duplicate.

**Rationale**: Single source of truth for provider-to-icon mapping. Buttons use `inline-flex` with `gap-2` for icon+text alignment (FR11).

### D6: Backend logos as inline SVGs in ProviderIcon

**Decision**: Add `supabase` and `gas` entries to the `PROVIDER_ICONS` mapping in `ProviderIcon`. Supabase uses the official green lightning bolt logo (2 paths + linear gradient). Google Apps Script uses the official 4-color stick-and-ball logo (4 paths). Both are inline SVG components, same as Google and Microsoft icons.

**Alternative**: Import logos as static SVG assets via Vite. Rejected — all other icons in `ProviderIcon` are inline SVG components; mixing approaches adds complexity for no gain.

**Alternative**: Use separate icon components in `ServerBackendSelection` instead of reusing `ProviderIcon`. Rejected — centralizing all provider/backend icons in one component keeps a single mapping and avoids duplication (FR12, FR13).

**Rationale**: Consistent with D3 pattern. `ProviderIcon` becomes the single source of truth for all service brand icons used across the app.

## Risks / Trade-offs

- [Risk] `app_metadata.provider` may be absent for email/password auth → Mitigation: treat empty/undefined as `null`, provider row is not rendered (FR7 condition: non-empty authProvider)
- [Risk] Supabase may change `app_metadata` structure → Mitigation: low risk, `provider` field is documented in Supabase SDK types; fallback to text-only is safe
- [Trade-off] Inline SVGs for Google/Microsoft are not auto-updated with brand changes → Acceptable for a personal app; trivially replaceable
