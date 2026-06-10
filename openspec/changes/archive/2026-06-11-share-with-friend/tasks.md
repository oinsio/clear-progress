# Implementation Tasks: Share with Friend

## 1. i18n Setup

- [x] 1.1 Add `share` namespace with keys to `packages/client/src/locales/ru.json` (FR7)
- [x] 1.2 Add `share` namespace with keys to `packages/client/src/locales/en.json` (FR7)

## 2. Share Hook Implementation

- [x] 2.1 Create `packages/client/src/hooks/useShare.ts` with clipboard copy logic (FR4)
- [x] 2.2 Copy invite message + app URL to clipboard (FR4)
- [x] 2.3 Add error handling for clipboard failures (FR4)
- [x] 2.4 Write unit tests for `useShare` hook covering all scenarios (FR4, NFR-P1)

## 3. Share Section Component

- [x] 3.1 Create `packages/client/src/components/settings/ShareAppSection.tsx` (FR1)
- [x] 3.2 Implement section header and description text from i18n (FR1, UX2)
- [x] 3.3 Add copy link button with proper aria-label from i18n (FR2, NFR-A1)
- [x] 3.4 Integrate `useShare` hook into button click handler (FR4)
- [x] 3.5 Add single-button alert dialog with accent color (FR5, FR6)
- [x] 3.6 Apply Tailwind styles matching existing settings sections (UX1, NFR-R1)

## 4. Settings Page Integration

- [x] 4.1 Import `ShareAppSection` in `packages/client/src/pages/SettingsPage.tsx` (FR1)
- [x] 4.2 Insert section after "Interface Scale" and before "Language" (FR1)

## 5. Unit Tests

- [x] 5.1 Write tests for `ShareAppSection` covering clipboard copy path (FR4)
- [x] 5.2 Write tests for dialog interactions (open, dismiss) (FR6, UX5)
- [x] 5.3 Write tests for i18n keys (FR7)
- [x] 5.4 Write tests for accessibility attributes (NFR-A1, NFR-A2, NFR-A3)
- [x] 5.5 Write tests for single OK button (no cancel button) (FR6)

## 6. BDD Unit Tests

- [x] 6.1 Create `app_sharing.feature` with scenarios (4 scenarios, 12 tests)
- [x] 6.2 Create `app_sharing.steps.ts` with step definitions
- [x] 6.3 Run BDD tests and verify all scenarios pass

## 7. BDD E2E Tests

- [x] 7.1 Create `app_sharing_nfr_e2e.feature` for NFR scenarios (8 scenarios)
- [x] 7.2 Create `app_sharing_nfr_e2e.steps.ts` with E2E step definitions
- [x] 7.3 Add scenarios for keyboard navigation (Enter, Escape) (NFR-A2)
- [x] 7.4 Add scenarios for responsive layout (320px, 2560px) (NFR-R1)
- [x] 7.5 Run E2E tests and verify all NFR scenarios pass

## 8. Accessibility Verification

- [x] 8.1 axe-core assertions in BDD E2E tests (NFR-A1, NFR-A2, NFR-A3)
- [x] 8.2 Manual: test with screen reader (VoiceOver) for aria-label announcement (NFR-A1, NFR-A3)

## 9. Performance Verification

- [x] 9.1 Unit test: clipboard copy completes within 100ms (NFR-P1)

## 10. Mutation Testing

- [x] 10.1 Run Stryker on `useShare.ts`
- [x] 10.2 Run Stryker on `ShareAppSection.tsx`
- [x] 10.3 Re-run Stryker on updated files after simplification

## 11. Build and Type Check

- [x] 11.1 Run `pnpm run build` to verify no type errors
- [x] 11.2 Run `pnpm run lint` to verify code style

## 12. Manual Verification

- [x] 12.1 Manual: verify copy link copies invite message + URL on macOS
- [x] 12.2 Manual: verify dialog shows single OK button in accent color

## 13. Documentation

- [x] 13.1 Update proposal.md — remove Web Share API, update FR/UX/Goals
- [x] 13.2 Update design.md — document clipboard-only decision
- [x] 13.3 Update spec.md — remove Web Share API scenarios
- [x] 13.4 Verify all traceability links (FR/NFR IDs) in code comments
