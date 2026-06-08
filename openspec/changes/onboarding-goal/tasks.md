# Onboarding Goal — Tasks

## 1. Constants and Template (FR5, FR6)

- [ ] 1.1 Add `ONBOARDING_SHOWN` to `STORAGE_KEYS` in `packages/client/src/constants/index.ts`
- [ ] 1.2 Create `OnboardingTaskTemplate` and `OnboardingTemplate` types in `packages/client/src/types/onboarding.ts`
- [ ] 1.3 Create declarative template `packages/client/src/constants/onboardingTemplate.ts` with goal + 5 tasks (i18n keys, box per task)
- [ ] 1.4 Add `onboarding.*` i18n keys to `ru.json` and `en.json` (goal name/description, 5 task names/descriptions, dialog title/body/accept/decline)

## 2. OnboardingService — Detection (FR1, FR7, NFR-P1)

- [ ] 2.1 BDD feature `onboarding_detection.feature`: scenarios for brand new user, returning user, existing data without flag
- [ ] 2.2 BDD step definitions `onboarding_detection.steps.ts` — RED
- [ ] 2.3 Implement `OnboardingService.shouldShowOnboarding()` — GREEN
- [ ] 2.4 Refactor + mutation testing on detection logic (target >=95%)

## 3. OnboardingService — Entity Creation (FR2, FR4)

- [ ] 3.1 BDD feature `onboarding_creation.feature`: scenarios for goal attributes, task box assignments, task sort order
- [ ] 3.2 BDD step definitions `onboarding_creation.steps.ts` — RED
- [ ] 3.3 Implement `OnboardingService.createOnboardingEntities(translate)` — GREEN
- [ ] 3.4 Refactor + mutation testing on creation logic (target >=95%)

## 4. useOnboarding Hook (FR1, FR3, FR7)

- [ ] 4.1 Unit tests for `useOnboarding`: states (checking, showing, dismissed), accept/decline flows
- [ ] 4.2 Implement `useOnboarding` hook — manages detection, dialog visibility, action handlers
- [ ] 4.3 Mutation testing on hook logic (target >=95%)

## 5. OnboardingDialog Component (UX1-UX4, NFR-A1, NFR-A2, NFR-R1)

- [ ] 5.1 Create `OnboardingDialog.tsx` — modal with title, description, accept/decline buttons
- [ ] 5.2 Integrate `useOnboarding` + `OnboardingDialog` into App.tsx (after providers)
- [ ] 5.3 BDD E2E feature `onboarding_e2e.feature`: accept flow creates goal + tasks, decline flow skips, dialog a11y
- [ ] 5.4 BDD E2E step definitions `onboarding_e2e.steps.ts`
- [ ] 5.5 axe-core assertions in E2E tests (NFR-A1, NFR-A2)

## 6. Verification

- [ ] 6.1 Mutation testing on `onboardingService.ts` and `onboardingTemplate.ts` (>=95%)
- [ ] 6.2 Build passes (`pnpm run build`)
