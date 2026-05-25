## Context

The app is deployed as a PWA using `vite-plugin-pwa` with Workbox. The current implementation includes:
- Web app manifest (`public/manifest.json`) with standalone display mode
- Service worker with precaching (all static assets) and runtime caching (Google avatars)
- `UpdateNotification` React component using `useRegisterSW` hook from `virtual:pwa-register/react`
- Register type `"prompt"` — user must explicitly accept updates
- Periodic update checks every 60 seconds

No formal specifications or BDD tests exist for PWA behavior. The existing E2E test (`pwa-update.spec.ts`) is not BDD-structured and relies on fragile real service worker interaction.

Context: driven by G1, G2, G3 from proposal.

## Goals / Non-Goals

**Goals:**
- Document all PWA behaviors as testable specifications
- Create BDD unit tests for `UpdateNotification` component logic
- Create BDD unit tests for service worker registration behavior
- Ensure traceability from FR requirements to test scenarios

**Non-Goals:**
- Modifying production PWA code
- Testing actual service worker lifecycle in browser (requires E2E infrastructure)
- Adding new PWA features (install prompt, push notifications)

## Decisions

### D1: BDD unit tests for UpdateNotification logic

**Decision**: Test `UpdateNotification` component behavior with vitest-cucumber by mocking `useRegisterSW` hook.

**Rationale**: The component's logic (show notification when `needRefresh` is true, call `updateServiceWorker` on button click) is testable without a real service worker. Mocking `virtual:pwa-register/react` isolates the component logic.

**Alternatives considered**:
- E2E with real service worker — too fragile, requires build + serve infrastructure
- Plain Vitest without BDD — misses the spec-to-test traceability

### D2: Manifest and caching verified via spec only (no automated test)

**Decision**: FR1 (manifest) and FR4 (runtime caching config) are documented in specs but verified by reading `manifest.json` and `vite.config.ts` directly. No automated BDD test.

**Rationale**: Manifest content and Vite config are static declarations. Testing them would just duplicate the config values in assertions, adding no value. The spec documents the expected state; a developer can verify by reading the file.

### D3: Remove legacy E2E test

**Decision**: Delete `src/test/e2e/pwa-update.spec.ts` and replace with BDD unit scenarios.

**Rationale**: The existing test is fragile (relies on real SW registration, uses `waitForTimeout`, conditional assertions). BDD unit tests with mocked SW provide reliable, fast feedback.

## Risks / Trade-offs

- [Risk] Mocking `useRegisterSW` may not catch integration issues with real service worker → Mitigation: the spec documents expected Workbox/vite-plugin-pwa behavior; actual SW behavior is covered by the library's own tests.
- [Risk] No E2E test for update notification in real browser → Mitigation: acceptable for now; add E2E when Playwright service worker testing matures.
