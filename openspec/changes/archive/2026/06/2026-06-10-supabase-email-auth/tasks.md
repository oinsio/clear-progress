## 1. Constants and types

- [x] 1.1 Add `OTP_RESEND_COOLDOWN_MS = 60000` and `OTP_CODE_LENGTH = 6` to `packages/client/src/constants/index.ts` (FR6)
- [x] 1.2 Add `SupabaseAuthMethods` interface (`{ oauthProviders: string[], isEmailEnabled: boolean }`) to `supabaseConnection.ts` (FR8, D1)
- [x] 1.3 Add i18n keys to `ru.json` and `en.json`: email input label, send code button, OTP screen title/hint, verify button, resend button with countdown, back button, error messages (FR1–FR10)

## 2. Service layer — fetchSupabaseProviders refactor

- [x] 2.1 TDD: Write failing tests for `fetchSupabaseProviders` returning `SupabaseAuthMethods` instead of `string[]` — cases: email enabled + OAuth providers, email disabled, only email, neither (FR8, D1)
- [x] 2.2 Refactor `fetchSupabaseProviders` to return `{ oauthProviders, isEmailEnabled }` — stop filtering email from results, extract it as a boolean flag (FR8)
- [x] 2.3 Update all call sites of `fetchSupabaseProviders` in `ServerSection.tsx` to destructure the new return type (FR8)
- [x] 2.4 Mutation testing on `supabaseConnection.ts` — target >= 95% (M3)

## 3. ProviderIcon — email support

- [x] 3.1 TDD: Write failing test for `ProviderIcon` with `provider="email"` rendering `Mail` icon from lucide-react (supabase-auth spec)
- [x] 3.2 Add `"email"` → `Mail` mapping to `ProviderIcon` component
- [x] 3.3 Mutation testing on `ProviderIcon.tsx` — target >= 95% (M3)

## 4. ServerOAuthProviders — email input form

- [x] 4.1 TDD: Write failing tests for `ServerOAuthProviders` with `isEmailEnabled` prop — divider visible, email input visible, send button enabled/disabled (FR1, FR11)
- [x] 4.2 Add `isEmailEnabled`, `onSendOtp`, and `emailLoading` props to `ServerOAuthProviders` (FR1, D2)
- [x] 4.3 Implement "or" divider and email input with `type="email"` + "Send code" button below OAuth buttons (FR1, FR11, NFR-A1)
- [x] 4.4 Implement conditional rendering: hide email form when `isEmailEnabled=false`, hide no-providers warning when email is enabled (supabase-ui-connection spec)
- [x] 4.5 Mutation testing on `ServerOAuthProviders.tsx` — target >= 95% (M3)

## 5. ServerEmailVerify — new OTP verification component

- [x] 5.1 TDD: Write failing tests for `ServerEmailVerify` — displays email, OTP input with `inputMode="numeric"`, verify button disabled until 6 chars, magic link hint, back button (FR3, FR4, FR9)
- [x] 5.2 Implement `ServerEmailVerify` component with props: `email`, `onVerify`, `onResend`, `onBack`, `isVerifying`, `error`, `resendCooldown` (FR3, FR4, FR9, FR10, NFR-A1)
- [x] 5.3 TDD: Write failing tests for resend cooldown display — button disabled during countdown, enabled after, shows "Resend (0:XX)" format (FR6, FR7)
- [x] 5.4 Implement cooldown display in `ServerEmailVerify` — `aria-live="polite"` on timer (FR6, NFR-A1)
- [x] 5.5 Mutation testing on `ServerEmailVerify.tsx` — target >= 95% (M3)

## 6. ServerSection — state machine integration

- [x] 6.1 TDD: Write failing tests for `supabase_email_otp` phase — renders `ServerEmailVerify`, stores email, back returns to `supabase_providers` (FR2, FR3, FR9, D4)
- [x] 6.2 Add `supabase_email_otp` to `ServerPhase` type and `pendingEmail` state (D4)
- [x] 6.3 Implement `handleSendOtp` — calls `signInWithOtp`, transitions to `supabase_email_otp` on success, shows error on failure (FR2)
- [x] 6.4 Implement `handleVerifyOtp` — calls `verifyOtp`, shows error on failure; success handled by `onAuthStateChange` (FR4)
- [x] 6.5 Implement `handleResendOtp` — calls `signInWithOtp` with stored email, resets cooldown (FR7)
- [x] 6.6 Implement `handleBackFromOtp` — returns to `supabase_providers` without disconnect (FR9)
- [x] 6.7 Pass `isEmailEnabled` and `onSendOtp` to `ServerOAuthProviders` in the `supabase_providers` phase (FR1)
- [x] 6.8 Render `ServerEmailVerify` in the `supabase_email_otp` phase (FR3)
- [x] 6.9 Mutation testing on `ServerSection.tsx` — target >= 95% (M3)

## 7. Verification and quality

- [x] 7.1 BDD unit: Write Gherkin feature `email_otp_auth.feature` with scenarios from email-otp-auth spec (@supabase-email-auth @FR1–FR11)
- [x] 7.2 BDD unit: Implement step definitions for email OTP scenarios
- [x] 7.3 axe-core: a11y covered via aria attributes in components; full axe-core scan deferred to E2E (M4, NFR-A1)
- [x] 7.4 Verify `pnpm run build` passes with no errors
