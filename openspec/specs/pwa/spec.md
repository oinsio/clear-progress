# PWA

## Purpose

Progressive Web App capability: installability, asset caching via service worker, update lifecycle.

## Requirements

### Requirement: Web app manifest
The app SHALL provide a web app manifest that enables Add to Home Screen functionality. The manifest MUST declare standalone display mode, app name, theme color, and at least one icon.

#### Scenario: Manifest declares standalone mode
- **WHEN** the browser reads the web app manifest
- **THEN** the `display` field is `standalone`
- **AND** the `name` field is `Clear Progress`
- **AND** the `theme_color` field is `#69b23e`

#### Scenario: Manifest includes a valid icon
- **WHEN** the browser reads the web app manifest
- **THEN** at least one icon with size 512x512 is declared
- **AND** the icon has purpose `any maskable`

### Requirement: Service worker registration
The app SHALL register a service worker on load using vite-plugin-pwa with `registerType: "prompt"`. The service worker MUST precache all static assets matching `**/*.{js,css,html,ico,png,svg}`.

#### Scenario: Service worker registers on app load
- **WHEN** the app loads in a browser that supports service workers
- **THEN** a service worker is registered via `useRegisterSW`

#### Scenario: Precache includes static assets
- **WHEN** the service worker activates
- **THEN** all files matching `**/*.{js,css,html,ico,png,svg}` are precached

### Requirement: Runtime caching for Google avatars
The app SHALL cache Google avatar images (`https://lh3.googleusercontent.com/*`) using a CacheFirst strategy with a maximum of 1 entry and 30-day expiration.

#### Scenario: Google avatar is cached on first load
- **WHEN** the app loads a Google avatar image
- **THEN** the image is stored in the `google-avatar-cache` cache
- **AND** subsequent requests serve the image from cache without network

#### Scenario: Cached avatar expires after 30 days
- **WHEN** a cached Google avatar is older than 30 days
- **THEN** the next request fetches a fresh copy from the network

### Requirement: Periodic update check
The app SHALL check for service worker updates every 60 seconds after initial registration.

#### Scenario: Update check runs periodically
- **WHEN** the service worker is successfully registered
- **THEN** an interval is set to call `registration.update()` every 60 seconds

### Requirement: Update notification display
When a new service worker version is detected (needRefresh becomes true), the app SHALL display a modal notification with a localized message and an "Update" button. The notification MUST NOT be dismissable without clicking "Update".

#### Scenario: Notification appears when new version is available
- **WHEN** `needRefresh` becomes `true`
- **THEN** an update notification modal is shown
- **AND** the modal displays the localized "new version available" message
- **AND** the modal contains an "Update" button

#### Scenario: Notification is not shown when no update is available
- **WHEN** `needRefresh` is `false`
- **THEN** no update notification is rendered

### Requirement: Update activation
Clicking the "Update" button SHALL call `updateServiceWorker(true)` to activate the waiting service worker and reload the page.

#### Scenario: User clicks Update button
- **WHEN** the update notification is visible
- **AND** the user clicks the "Update" button
- **THEN** `updateServiceWorker` is called with `true`

## Relations

- **offline-mode**: Offline data availability is handled by IndexedDB/Dexie, independently of PWA service worker caching.
