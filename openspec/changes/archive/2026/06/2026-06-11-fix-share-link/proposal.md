# fix-share-link

## Why

The "Share with friend" button copies an incomplete URL: `https://oinsio.github.io` instead of `https://oinsio.github.io/clear-progress/`. The app is deployed to a subpath (`base: "/clear-progress/"`), but `useShare` uses `window.location.origin`, which does not include the base path.

## What Changes

- **MODIFIED**: `useShare` hook — build URL using `import.meta.env.BASE_URL`
- **MODIFIED**: `useShare` tests — update mocks and expectations for the new URL

## Goals

- G1: The link copied via "Share" leads to the app root, not the host root

## Non-Goals

- NG1: Changing invite text or share button UI
- NG2: Supporting deep-links to specific pages

## Users & Scenarios

- U1: User clicks "Share with friend" — clipboard receives text with the full app URL

## Requirements

### Functional

- FR1: Clipboard URL is formed as `origin + BASE_URL` (e.g. `https://oinsio.github.io/clear-progress/`)
- FR2: When `BASE_URL = "/"` (local dev), the URL contains no duplicate slashes

### Non-Functional

#### Performance

- NFR-P1: Copy operation completes in < 100ms (unchanged)

## UX Acceptance Criteria

- UX1: The copied link opens the application when navigated to

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `app-sharing`: URL is formed with base path taken into account (FR1, FR2)

## Behavior

Update existing scenarios in `features/app_sharing/`.

## Affected IA

No changes.

## Success Metrics

- M1: Copied URL contains the full path to the application (automated test)

## Open Questions

_(none)_
