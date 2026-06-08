## 1. Auth Layer — Provider Extraction

- [x] 1.1 Add `onAuthProviderUpdate` callback prop to `SupabaseAuthSync` and extract `session.user.app_metadata.provider` on `SIGNED_IN`/`INITIAL_SESSION` events (FR1, FR2, FR3)
- [x] 1.2 TDD: Unit tests for `SupabaseAuthSync` — provider extracted on sign-in, initial session; NOT on token refresh; cleared on sign-out
- [x] 1.3 Add `authProvider: string | null` to `AuthContextValue` in `AuthProvider`, wire `handleAuthProviderUpdate` callback, pass to `SupabaseAuthSync`, reset on clear (FR4, FR5, FR6)
- [x] 1.4 TDD: Unit tests for `AuthProvider` — `authProvider` set on Supabase auth, null for GAS, null on disconnect

## 2. Provider Icon Component

- [x] 2.1 Create `ProviderIcon` component with provider-to-icon mapping: inline SVG for google/azure, lucide-react for github/apple/facebook/twitter/gitlab/slack/linkedin, null for unknown (FR9, FR10)
- [x] 2.2 TDD: Unit tests for `ProviderIcon` — renders correct icon for each known provider, returns null for unknown, all icons have `aria-hidden="true"` (NFR-A2)

## 3. UI — Provider Row in ServerConnectedStatus

- [x] 3.1 Add i18n keys `settings.server.oauthProvider` to `ru.json` ("OAuth провайдер") and `en.json` ("OAuth provider")
- [x] 3.2 Add provider row to `ServerConnectedStatus` between URL and account rows, conditionally rendered when `authProvider` is non-empty and `config.type` is `"supabase"` (FR7, FR8, UX1, UX2, UX3)
- [x] 3.3 TDD: Unit tests for `ServerConnectedStatus` — provider row visible for Supabase with provider, hidden when no provider, hidden for GAS, correct testid and styling (NFR-A1)

## 3b. Provider Icons on OAuth Buttons

- [x] 3b.1 Add `ProviderIcon` to each provider button in `ServerOAuthProviders` (FR11, UX2)
- [x] 3b.2 TDD: Unit test for `ServerOAuthProviders` — provider icon rendered on button for known provider

## 5. Backend Selection Logos

- [ ] 5.1 Add `SupabaseIcon` (green lightning bolt, inline SVG with gradient) and `GasIcon` (Google Apps Script 4-color logo, inline SVG) to `ProviderIcon` component, mapped as `supabase` and `gas` in `PROVIDER_ICONS` (FR12)
- [ ] 5.2 TDD: Unit tests for `ProviderIcon` — renders correct icon for `supabase` and `gas` providers, both have `aria-hidden="true"` (NFR-A3)
- [ ] 5.3 Add `ProviderIcon` to `ServerBackendSelection` buttons: `supabase` icon on Supabase button, `gas` icon on GAS button, inline-flex layout with gap (FR13)
- [ ] 5.4 TDD: Unit tests for `ServerBackendSelection` — both buttons render corresponding icons with `aria-hidden="true"`

## 6. Verification

- [ ] 6.1 Mutation testing on changed files: `ProviderIcon`, `ServerBackendSelection` — target >= 95% (M2)
- [ ] 6.2 Build verification: `pnpm run build` passes
