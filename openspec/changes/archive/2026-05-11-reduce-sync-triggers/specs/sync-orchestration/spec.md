# Sync Orchestration — Delta Spec

## REMOVED Requirements

### Requirement: T6: Visibility change (tab becomes visible)

When `document.visibilityState` changes to `"visible"`, a sync cycle runs.

**Reason**: Creates visual noise (spinner) on every tab switch. Remaining triggers (mount, periodic, post-mutation, online recovery) are sufficient for data freshness in a personal app with rare multi-device concurrent editing.

**Migration**: No migration needed. Data will sync on mount, every 5 minutes via periodic sync, within 15 seconds after mutations via schedulePush, and on network recovery.

#### Scenario: Tab becomes visible after being hidden
- **WHEN** user switches to the app tab (document.visibilityState changes to "visible")
- **THEN** sync cycle does NOT run (no spinner appears)

### Requirement: T7: Window focus

When `window` fires the `focus` event, a sync cycle runs.

**Reason**: Creates visual noise (spinner) on every window focus. Remaining triggers (mount, periodic, post-mutation, online recovery) are sufficient for data freshness in a personal app with rare multi-device concurrent editing.

**Migration**: No migration needed. Data will sync on mount, every 5 minutes via periodic sync, within 15 seconds after mutations via schedulePush, and on network recovery.

#### Scenario: Window receives focus
- **WHEN** user focuses the app window
- **THEN** sync cycle does NOT run (no spinner appears)

### Requirement: T8: Page show (bfcache restore)

When `window` fires `pageshow` with `event.persisted === true`, a sync cycle runs.

**Reason**: Creates visual noise (spinner) on bfcache restore. Remaining triggers (mount, periodic, post-mutation, online recovery) are sufficient for data freshness in a personal app with rare multi-device concurrent editing.

**Migration**: No migration needed. Data will sync on mount, every 5 minutes via periodic sync, within 15 seconds after mutations via schedulePush, and on network recovery.

#### Scenario: Page restored from bfcache
- **WHEN** page is restored from bfcache (pageshow event with persisted=true)
- **THEN** sync cycle does NOT run (no spinner appears)
