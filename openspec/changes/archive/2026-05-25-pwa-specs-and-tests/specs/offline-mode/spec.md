## ADDED Requirements

### Requirement: Separation of PWA caching and offline data
The PWA service worker handles asset caching (app shell, static files). Offline data availability is handled entirely by IndexedDB via Dexie. These are independent concerns: the service worker does NOT cache API responses or IndexedDB data.

#### Scenario: Service worker caches assets, not data
- **WHEN** the service worker precaches files
- **THEN** only static assets (JS, CSS, HTML, icons) are cached
- **AND** no API responses or data payloads are cached by the service worker

#### Scenario: Data availability is independent of service worker
- **WHEN** the service worker is not yet installed (first visit)
- **THEN** data reads still work via IndexedDB
- **AND** the app is functional for CRUD operations

## Relations

- **pwa**: PWA spec covers service worker lifecycle and asset caching. This spec clarifies that data availability is handled separately via IndexedDB.
