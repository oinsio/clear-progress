## MODIFIED Requirements

### Requirement: Ping recovery interval does not start for project_paused
When sync status becomes `"project_paused"`, the system SHALL NOT start the ping recovery interval. The periodic sync interval (every `SYNC_INTERVAL_MS`) SHALL continue running normally.

#### Scenario: Ping interval not started when project paused
- **WHEN** `syncStatus` becomes `"project_paused"`
- **THEN** ping interval is NOT started
- **AND** periodic sync interval continues

#### Scenario: Ping interval still starts for error and offline
- **WHEN** `syncStatus` becomes `"error"` or `"offline"`
- **THEN** ping interval starts as before
