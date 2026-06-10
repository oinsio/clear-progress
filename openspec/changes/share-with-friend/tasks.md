# Implementation Tasks: Share with Friend

## 1. i18n Setup

- [ ] 1.1 Add `share` namespace with keys to `packages/client/src/locales/ru.json` (FR7)
- [ ] 1.2 Add `share` namespace with keys to `packages/client/src/locales/en.json` (FR7)

## 2. Share Hook Implementation

- [ ] 2.1 Create `packages/client/src/hooks/useShare.ts` with Web Share API detection (FR3)
- [ ] 2.2 Implement clipboard fallback logic in `useShare.ts` (FR4)
- [ ] 2.3 Add error handling for AbortError and clipboard failures (FR3, FR4)
- [ ] 2.4 Write unit tests for `useShare` hook covering all scenarios (FR3, FR4, NFR-P1)

## 3. Share Section Component

- [ ] 3.1 Create `packages/client/src/components/settings/ShareAppSection.tsx` (FR1)
- [ ] 3.2 Implement section header and description text from i18n (FR1, UX2)
- [ ] 3.3 Add share button with proper aria-label from i18n (FR2, NFR-A1)
- [ ] 3.4 Integrate `useShare` hook into button click handler (FR3, FR4)
- [ ] 3.5 Add confirmation dialog state management (FR5, FR6)
- [ ] 3.6 Apply Tailwind styles matching existing settings sections (UX1, NFR-R1)

## 4. Confirmation Dialog Integration

- [ ] 4.1 Import and use existing `ConfirmDialog` component for success state (FR5, FR6)
- [ ] 4.2 Add error dialog variant for clipboard failure (FR4)
- [ ] 4.3 Ensure dialog has proper ARIA attributes and keyboard navigation (NFR-A2, NFR-A3, UX5)

## 5. Settings Page Integration

- [ ] 5.1 Import `ShareAppSection` in `packages/client/src/pages/SettingsPage.tsx` (FR1)
- [ ] 5.2 Insert section after "Interface Scale" and before "Language" (FR1)
- [ ] 5.3 Visual regression test: screenshot Settings page before/after share section (UX1)

## 6. Unit Tests

- [ ] 6.1 Write tests for `ShareAppSection` covering Web Share API path (FR3)
- [ ] 6.2 Write tests for `ShareAppSection` covering clipboard fallback path (FR4)
- [ ] 6.3 Write tests for dialog interactions (open, dismiss, backdrop click) (FR6, UX5)
- [ ] 6.4 Write tests for i18n in both locales, including locale switching ru ↔ en (FR7)
- [ ] 6.5 Write tests for accessibility attributes (NFR-A1, NFR-A2, NFR-A3)

## 7. BDD Unit Tests

- [ ] 7.1 Create `packages/client/src/test/features/app_sharing/app_sharing.feature` with scenarios from spec
- [ ] 7.2 Create `packages/client/src/test/features/app_sharing/app_sharing.steps.ts` with step definitions
- [ ] 7.3 Run BDD tests and verify all scenarios pass

## 8. BDD E2E Tests

- [ ] 8.1 Create `packages/client/src/test/features/app_sharing/app_sharing_nfr_e2e.feature` for NFR scenarios
- [ ] 8.2 Create `packages/client/src/test/features/app_sharing/steps/app_sharing_nfr_e2e.steps.ts` with E2E step definitions
- [ ] 8.3 Add scenarios for keyboard navigation (Tab, Enter, Escape) (NFR-A2)
- [ ] 8.4 Add scenarios for responsive layout (320px, 768px, 1024px, 2560px) (NFR-R1)
- [ ] 8.5 Add scenario for clipboard fallback on desktop (mock navigator.share unavailable) (FR4)
- [ ] 8.6 Run E2E tests and verify all NFR scenarios pass

## 9. Accessibility Verification

- [ ] 9.1 axe-core assertions in BDD E2E tests for Settings page with share section (NFR-A1, NFR-A2, NFR-A3)
- [ ] 9.2 BDD E2E scenario: focus trap in confirmation dialog (Tab cycles within dialog, no escape to background) (NFR-A2)
- [ ] 9.3 Manual: test with screen reader (VoiceOver) for aria-label announcement (NFR-A1, NFR-A3)

## 10. Performance Verification

- [ ] 10.1 Unit test: share via Web Share API completes within 100ms (`performance.now()` assertion) (NFR-P1)
- [ ] 10.2 Unit test: clipboard copy completes within 100ms (`performance.now()` assertion) (NFR-P1)

## 11. Mutation Testing

- [ ] 11.1 Run Stryker on `useShare.ts` (target >=95%, minimum >=90%)
- [ ] 11.2 Run Stryker on `ShareAppSection.tsx` (target >=95%, minimum >=90%)
- [ ] 11.3 Kill survived mutants with additional tests if needed

## 12. Build and Type Check

- [ ] 12.1 Run `pnpm run build` to verify no type errors
- [ ] 12.2 Run `pnpm run typecheck` to verify all packages compile
- [ ] 12.3 Run `pnpm run lint` to verify code style

## 13. Manual Verification

- [ ] 13.1 Manual: test on iOS Safari (mobile) — verify native share sheet appears
- [ ] 13.2 Manual: test on Android Chrome (mobile) — verify native share sheet appears
- [ ] 13.3 Manual: test on macOS Safari — verify macOS share menu appears

## 14. Documentation

- [ ] 14.1 Update `CLAUDE.md` if any new patterns introduced (N/A for this change)
- [ ] 14.2 Verify all traceability links (FR/NFR IDs) in code comments
