# PWA Specs and Tests

## Why

The app already ships as a PWA (service worker via vite-plugin-pwa, web app manifest, update notification component), but there are no formal specifications documenting this behavior. Without specs, it is impossible to verify coverage with BDD tests or reason about edge cases. Additionally, the existing Playwright E2E test (`pwa-update.spec.ts`) is fragile and not BDD-structured.

## What Changes

- **ADDED** `pwa` capability spec covering service worker lifecycle, manifest, caching strategy, and update notification behavior
- **MODIFIED** `offline-mode` spec with minor clarification on the relationship between offline mode and PWA service worker

## Goals

- G1: Every PWA behavior has a formal requirement with an ID
- G2: All PWA requirements are covered by BDD tests (unit or E2E)
- G3: Replace fragile Playwright test with proper BDD scenarios

## Non-Goals

- NG1: Changing the PWA implementation itself — this change is documentation and tests only
- NG2: Adding install prompt (A2HS) functionality — separate change if needed
- NG3: Adding push notifications — out of scope
- NG4: Changing caching strategies — implementation stays as-is

## Users & Scenarios

- U1: Developer maintaining the app — needs specs to understand PWA behavior and avoid regressions
- U2: CI pipeline — needs automated BDD tests to catch regressions

## Requirements

### Functional

- FR1: Web app manifest declares standalone display mode, app name, theme color, and icons — enabling Add to Home Screen
- FR2: Service worker is registered on app load via vite-plugin-pwa with `registerType: "prompt"` strategy
- FR3: Service worker precaches all static assets (JS, CSS, HTML, icons, SVG) matching `**/*.{js,css,html,ico,png,svg}`
- FR4: Google avatar images are cached at runtime with CacheFirst strategy, max 1 entry, 30-day expiration
- FR5: When a new service worker version is detected, the app shows an update notification modal
- FR6: The update notification displays a localized message and an "Update" button
- FR7: Clicking the "Update" button activates the waiting service worker and reloads the page
- FR8: The app periodically checks for service worker updates every 60 seconds after initial registration

### Non-Functional

#### Performance
- NFR-P1: Precached assets load instantly from service worker cache on repeat visits (no network required for app shell)

#### Accessibility
- NFR-A1: Update notification modal is perceivable — sufficient contrast, readable text
- NFR-A2: Update button is operable via keyboard

#### Responsive
- NFR-R1: Update notification modal is centered and fits on screens from 320px width

## UX Acceptance Criteria

- UX1: Update notification appears as a centered modal with semi-transparent backdrop
- UX2: User cannot dismiss the notification without updating (no close/dismiss button)
- UX3: Update button has clear, localized label

## UI States Matrix

| State             | Network | SW Update Available | UI                                    |
|-------------------|---------|---------------------|---------------------------------------|
| Normal            | any     | no                  | No notification shown                 |
| Update available  | any     | yes                 | Modal with message + "Update" button  |

## Behavior

- `features/pwa/service_worker_registration.feature` — @pwa-specs-and-tests @FR2 @FR3 @FR8
- `features/pwa/update_notification.feature` — @pwa-specs-and-tests @FR5 @FR6 @FR7
- `features/pwa/manifest.feature` — @pwa-specs-and-tests @FR1 (E2E)
- `features/pwa/caching_strategy.feature` — @pwa-specs-and-tests @FR4 (E2E)

## Visual Reference

No design changes. Existing implementation is the reference.

## Affected IA

No changes.

## Success Metrics

- M1: 100% of FR requirements have at least one BDD scenario
- M2: All BDD unit tests pass
- M3: Mutation score >= 90% on UpdateNotification component logic

## Open Questions

- None

## Capabilities

### New Capabilities
- `pwa`: Service worker lifecycle, web app manifest, precaching, runtime caching, and update notification behavior

### Modified Capabilities
- `offline-mode`: Clarify relationship between PWA service worker (asset caching) and offline-mode (data availability via IndexedDB)

## Impact

- Test files: new BDD feature files and step definitions for PWA behavior
- Spec files: new `openspec/specs/pwa/spec.md`, delta for `offline-mode`
- No production code changes expected
