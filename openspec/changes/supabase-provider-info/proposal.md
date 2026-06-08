# supabase-provider-info

## Why

When connected to a Supabase backend, the Settings page shows the server URL and user email, but not which OAuth provider was used for authentication. Users who have multiple providers configured (e.g., Google + GitHub) cannot see which one is active for the current session. Adding this information improves transparency and helps with troubleshooting auth issues.

## What Changes

- **ADDED**: Extract `app_metadata.provider` from Supabase session in `SupabaseAuthSync` and propagate through `AuthProvider` context
- **ADDED**: Display OAuth provider name with icon in `ServerConnectedStatus` between URL and account rows (Supabase only)
- **ADDED**: Provider icon component with inline SVG for Google/Microsoft, lucide-react icons for GitHub/Apple/Facebook/Twitter/GitLab/Slack/LinkedIn, text-only fallback for unknown providers

## Goals

- G1: User can see which OAuth provider authenticated their current Supabase session
- G2: Provider display is visually consistent with existing connection info block

## Non-Goals

- NG1: Displaying provider info for GAS backend (always Google, implicit)
- NG2: Allowing users to switch providers from the connected state
- NG3: Supporting provider-specific icons beyond Google, Microsoft, and lucide-react set

## Users & Scenarios

- U1: User connected via Google OAuth — sees Google icon + "Google" label
- U2: User connected via GitHub OAuth — sees GitHub icon + "GitHub" label
- U3: User connected via an uncommon provider (e.g., Keycloak) — sees provider name as text without icon

## Requirements

### Functional

- FR1: `SupabaseAuthSync` SHALL extract `session.user.app_metadata.provider` on `SIGNED_IN` and `INITIAL_SESSION` events and call `onAuthProviderUpdate(provider)` callback
- FR2: `SupabaseAuthSync` SHALL NOT call `onAuthProviderUpdate` on `TOKEN_REFRESHED` events
- FR3: `SupabaseAuthSync` SHALL call `onAuthProviderUpdate("")` on `SIGNED_OUT` event (via `onClear`)
- FR4: `AuthProvider` SHALL expose `authProvider: string | null` in its context value
- FR5: `AuthProvider` SHALL pass `handleAuthProviderUpdate` callback to `SupabaseAuthSync`
- FR6: `AuthProvider` SHALL reset `authProvider` to `null` on disconnect/clear
- FR7: `ServerConnectedStatus` SHALL display OAuth provider row between URL and account rows when `authProvider` is non-empty and `config.type` is `"supabase"`
- FR8: Provider row SHALL show provider icon (if available) and capitalized provider name
- FR9: Provider icon mapping: `google` → inline SVG, `azure` → inline Microsoft SVG, `github`/`apple`/`facebook`/`twitter`/`gitlab`/`slack`/`linkedin` → lucide-react icons
- FR10: Unknown providers SHALL display only capitalized text without icon (fallback)

### Non-Functional

#### Accessibility

- NFR-A1: Provider row SHALL have appropriate semantic markup (no interactive elements, informational only)
- NFR-A2: Provider icons SHALL have `aria-hidden="true"` since the text label is always present

## UX Acceptance Criteria

- UX1: Provider row appears between URL and account email, maintaining the same text style (`text-xs text-gray-400`)
- UX2: Provider icon is sized consistently with the text (14-16px)
- UX3: Label reads "OAuth провайдер" (ru) / "OAuth provider" (en) followed by colon and provider name

## Behavior

Reference: `features/supabase_provider_info.feature` (`@supabase-provider-info` tags)

## Affected IA

No changes — the provider info row is added within the existing ServerConnectedStatus component layout.

## Success Metrics

- M1: OAuth provider is visible in ServerConnectedStatus for 100% of authenticated Supabase sessions
- M2: All provider icon mappings covered by unit tests with mutation score >= 95%

## Open Questions

None.

## Capabilities

### New Capabilities

- `supabase-provider-display`: OAuth provider name and icon display in ServerConnectedStatus for Supabase connections

### Modified Capabilities

- `supabase-auth`: Add `authProvider` extraction from `app_metadata.provider` to SupabaseAuthSync and AuthProvider context

## Impact

- `packages/client/src/app/providers/SupabaseAuthSync.tsx` — new callback prop, provider extraction
- `packages/client/src/app/providers/AuthProvider.tsx` — new context field, new callback
- `packages/client/src/components/settings/ServerConnectedStatus.tsx` — new provider row
- New file: provider icon mapping component
- `packages/client/src/locales/ru.json`, `en.json` — new i18n key
