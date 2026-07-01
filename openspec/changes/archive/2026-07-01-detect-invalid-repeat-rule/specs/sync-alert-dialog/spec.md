## MODIFIED Requirements

### Requirement: SyncAlertQueue shows multiple dialogs sequentially
When multiple sync problems occur in one cycle, the system SHALL add alerts to AlertProvider via `addAlerts()` instead of storing them in SyncProvider state. Each sync problem SHALL be added as an alert with type `sync`. The SyncAlertQueue component and SyncProvider's `pendingSyncAlerts`/`clearSyncAlerts` state SHALL be removed — AlertProvider and AlertOverlay handle all alert rendering and navigation.

#### Scenario: Two sync problems show in alert overlay
- **WHEN** sync cycle produces 2 healable corrections with data loss
- **THEN** 2 alerts of type "sync" are added to AlertProvider
- **AND** AlertOverlay renders them with paginated navigation

#### Scenario: Single sync problem shows single alert
- **WHEN** sync cycle produces 1 healable correction with data loss
- **THEN** 1 alert of type "sync" is added to AlertProvider

#### Scenario: SyncProvider no longer holds alert state
- **WHEN** SyncProvider is initialized
- **THEN** it does not have `pendingSyncAlerts` or `clearSyncAlerts` in its context value
