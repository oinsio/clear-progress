## ADDED Requirements

### Requirement: Configurable periodic sync interval

The periodic sync trigger (T2) SHALL derive its period from the `sync_interval` setting rather than the fixed `SYNC_INTERVAL_MS` constant. `SYNC_INTERVAL_MS` SHALL remain as the default when the setting is absent. When the effective interval changes at runtime — whether via a local edit (signalled by `SYNC_TIMING_CHANGED_EVENT`) or a value arriving through pull (signalled by `sync_complete`) — the system SHALL re-read the setting, clear the existing `setInterval`, and create a new one with the updated period, without requiring an app reload. When the setting is empty/disabled, no periodic interval SHALL be running. # implements FR3 of configurable-sync-timing

#### Scenario: Interval uses the configured value
- **WHEN** SyncProvider is mounted with `sync_interval` resolving to 30 minutes
- **THEN** the periodic sync interval fires every 30 minutes

#### Scenario: Interval recreated on change
- **WHEN** the periodic interval is running with a 5-minute period
- **AND** `sync_interval` changes to 10 minutes
- **THEN** the previous interval is cleared
- **AND** a new interval is created with a 10-minute period

#### Scenario: Disabled interval runs no periodic sync
- **WHEN** `sync_interval` is empty/disabled
- **THEN** no periodic sync interval is created

#### Scenario: Pulled interval value takes effect without reload
- **WHEN** a sync pull stores a new `sync_interval` value
- **AND** the sync completes (`sync_complete` fires)
- **THEN** the periodic interval is recreated using the pulled value

#### Scenario: Default preserved when setting absent
- **WHEN** no `sync_interval` value has been stored
- **THEN** the periodic interval fires every `SYNC_INTERVAL_MS` (5 minutes)

### Requirement: Configurable debounced push delay

The debounced push trigger (T3, `schedulePush`) SHALL read the current `auto_sync_delay` setting at schedule time rather than the fixed `SYNC_DEBOUNCE_MS` constant. `SYNC_DEBOUNCE_MS` SHALL remain as the default when the setting is absent. A `0`/empty value SHALL schedule an immediate sync (0 ms timeout). The effective delay SHALL be refreshed on `SYNC_TIMING_CHANGED_EVENT` (local write) and on `sync_complete` (value arriving via pull). Multiple mutations within the debounce window SHALL continue to reset the timer so only one sync fires after the last mutation. # implements FR4 of configurable-sync-timing

#### Scenario: Debounce uses the configured delay
- **WHEN** `auto_sync_delay` resolves to 60 seconds
- **AND** `schedulePush` is called
- **THEN** a sync is scheduled 60 seconds after the last call

#### Scenario: Zero delay schedules immediate sync
- **WHEN** `auto_sync_delay` resolves to 0 (or empty)
- **AND** `schedulePush` is called
- **THEN** a sync is scheduled with a 0 ms timeout

#### Scenario: Latest delay value is used
- **WHEN** `auto_sync_delay` changes from 15 to 5 seconds
- **AND** `schedulePush` is called after the change
- **THEN** the sync is scheduled using the 5-second delay

#### Scenario: Pulled delay value takes effect without reload
- **WHEN** a sync pull stores a new `auto_sync_delay` value
- **AND** the sync completes (`sync_complete` fires)
- **AND** `schedulePush` is called
- **THEN** the sync is scheduled using the pulled delay

#### Scenario: Default preserved when setting absent
- **WHEN** no `auto_sync_delay` value has been stored
- **AND** `schedulePush` is called
- **THEN** a sync is scheduled `SYNC_DEBOUNCE_MS` (15 seconds) after the last call
