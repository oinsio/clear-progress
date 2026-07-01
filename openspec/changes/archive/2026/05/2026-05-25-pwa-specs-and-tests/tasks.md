## 1. BDD Feature Files

- [x] 1.1 Create `packages/client/src/test/features/pwa/update_notification.feature` — scenarios for FR5, FR6, FR7 (notification display, localized text, update button click)
- [x] 1.2 Create `packages/client/src/test/features/pwa/service_worker_registration.feature` — scenarios for FR2, FR8 (SW registration, periodic update check)

## 2. BDD Step Definitions

- [x] 2.1 Create `packages/client/src/test/features/pwa/steps/update_notification.steps.ts` — mock `useRegisterSW`, test UpdateNotification component rendering and click behavior
- [x] 2.2 Create `packages/client/src/test/features/pwa/steps/service_worker_registration.steps.ts` — mock `useRegisterSW`, test onRegisteredSW callback sets interval

## 3. Cleanup

- [x] 3.1 Delete legacy E2E test `packages/client/src/test/e2e/pwa-update.spec.ts`

## 4. Verification

- [x] 4.1 Run `pnpm run test` — all BDD tests pass
- [x] 4.2 Run `pnpm run build` — build succeeds
