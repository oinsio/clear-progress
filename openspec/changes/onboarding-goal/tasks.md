# Onboarding Goal — Tasks

## 1. Constants and Template (FR5, FR6)

- [x] 1.1 Add `ONBOARDING_SHOWN` to `STORAGE_KEYS` in `packages/client/src/constants/index.ts`
- [x] 1.2 Create `OnboardingTaskTemplate` and `OnboardingTemplate` types in `packages/client/src/types/onboarding.ts`
- [x] 1.3 Create declarative template `packages/client/src/constants/onboardingTemplate.ts` with goal + 5 tasks (i18n keys, box per task)
- [x] 1.4 Add `onboarding.*` i18n keys to `ru.json` and `en.json` (goal name/description, 5 task names/descriptions, dialog title/body/accept/decline)

## 2. OnboardingService — Detection (FR1, FR7, NFR-P1)

- [x] 2.1 BDD feature `onboarding_detection.feature`: scenarios for brand new user, returning user, existing data without flag
- [x] 2.2 BDD step definitions `onboarding_detection.steps.ts` — RED
- [x] 2.3 Implement `OnboardingService.shouldShowOnboarding()` — GREEN
- [x] 2.4 Refactor + mutation testing on detection logic (target >=95%)

## 3. OnboardingService — Entity Creation (FR2, FR4)

- [x] 3.1 BDD feature `onboarding_creation.feature`: scenarios for goal attributes, task box assignments, task sort order
- [x] 3.2 BDD step definitions `onboarding_creation.steps.ts` — RED
- [x] 3.3 Implement `OnboardingService.createOnboardingEntities(translate)` — GREEN
- [x] 3.4 Refactor + mutation testing on creation logic (target >=95%)

## 4. useOnboarding Hook (FR1, FR3, FR7)

- [x] 4.1 Unit tests for `useOnboarding`: states (checking, showing, dismissed), accept/decline flows
- [x] 4.2 Implement `useOnboarding` hook — manages detection, dialog visibility, action handlers
- [x] 4.3 Mutation testing on hook logic (target >=95%)

## 5. OnboardingDialog Component (UX1-UX4, NFR-A1, NFR-A2, NFR-R1)

- [x] 5.1 Create `OnboardingDialog.tsx` — modal with title, description, accept/decline buttons
- [x] 5.2 Integrate `useOnboarding` + `OnboardingDialog` into App.tsx (after providers)
- [x] 5.3 BDD E2E feature `onboarding_e2e.feature`: accept flow creates goal + tasks, decline flow skips, dialog a11y
- [x] 5.4 BDD E2E step definitions `onboarding_e2e.steps.ts`
- [x] 5.5 axe-core assertions in E2E tests (NFR-A1, NFR-A2)

## 6. Verification

- [x] 6.1 Mutation testing on `onboardingService.ts` and `onboardingTemplate.ts` (>=95%)
- [x] 6.2 Build passes (`pnpm run build`)
