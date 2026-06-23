## MODIFIED Requirements

### Requirement: Service worker registration
The app SHALL register a service worker on load using vite-plugin-pwa with `registerType: "prompt"`. The service worker MUST precache all static assets matching `**/*.{js,mjs,css,html,ico,png,svg}`. The workbox `maximumFileSizeToCacheInBytes` SHALL be set to at least 6 MiB to accommodate the main bundle with inlined mermaid diagram renderers.

#### Scenario: Service worker registers on app load
- **WHEN** the app loads in a browser that supports service workers
- **THEN** a service worker is registered via `useRegisterSW`

#### Scenario: Precache includes static assets
- **WHEN** the service worker activates
- **THEN** all files matching `**/*.{js,mjs,css,html,ico,png,svg}` are precached

#### Scenario: Large main bundle is precached
- **WHEN** the main JS bundle exceeds 4 MiB due to inlined mermaid renderers
- **THEN** the service worker precaches it without errors
- **AND** `maximumFileSizeToCacheInBytes` is at least 6 MiB
