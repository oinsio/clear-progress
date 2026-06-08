## 1. Auth Layer — Provider Extraction

- [ ] 1.1 Add `onAuthProviderUpdate` callback prop to `SupabaseAuthSync` and extract `session.user.app_metadata.provider` on `SIGNED_IN`/`INITIAL_SESSION` events (FR1, FR2, FR3)
- [ ] 1.2 TDD: Unit tests for `SupabaseAuthSync` — provider extracted on sign-in, initial session; NOT on token refresh; cleared on sign-out
- [ ] 1.3 Add `authProvider: string | null` to `AuthContextValue` in `AuthProvider`, wire `handleAuthProviderUpdate` callback, pass to `SupabaseAuthSync`, reset on clear (FR4, FR5, FR6)
- [ ] 1.4 TDD: Unit tests for `AuthProvider` — `authProvider` set on Supabase auth, null for GAS, null on disconnect

## 2. Provider Icon Component

- [ ] 2.1 Create `ProviderIcon` component with provider-to-icon mapping: inline SVG for google/azure, lucide-react for github/apple/facebook/twitter/gitlab/slack/linkedin, null for unknown (FR9, FR10)
- [ ] 2.2 TDD: Unit tests for `ProviderIcon` — renders correct icon for each known provider, returns null for unknown, all icons have `aria-hidden="true"` (NFR-A2)

## 3. UI — Provider Row in ServerConnectedStatus

- [ ] 3.1 Add i18n keys `settings.server.oauthProvider` to `ru.json` ("OAuth провайдер") and `en.json` ("OAuth provider")
- [ ] 3.2 Add provider row to `ServerConnectedStatus` between URL and account rows, conditionally rendered when `authProvider` is non-empty and `config.type` is `"supabase"` (FR7, FR8, UX1, UX2, UX3)
- [ ] 3.3 TDD: Unit tests for `ServerConnectedStatus` — provider row visible for Supabase with provider, hidden when no provider, hidden for GAS, correct testid and styling (NFR-A1)

## 4. Verification

- [ ] 4.1 Mutation testing on changed files: `SupabaseAuthSync`, `AuthProvider`, `ProviderIcon`, `ServerConnectedStatus` — target >= 95% (M2)
- [ ] 4.2 Build verification: `pnpm run build` passes
