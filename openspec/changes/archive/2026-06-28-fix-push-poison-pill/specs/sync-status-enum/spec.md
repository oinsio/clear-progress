## ADDED Requirements

### Requirement: syncStatus replaces needsSync boolean
All entity types SHALL use `syncStatus: "synced" | "pending" | "rejected"` instead of `needsSync: boolean`. The field SHALL be stored in IndexedDB and used for sync decisions and UI indicators.

#### Scenario: New local record has pending status
- **WHEN** user creates a new task locally
- **THEN** the task has `syncStatus: "pending"`

#### Scenario: Successfully synced record has synced status
- **WHEN** server accepts a pushed record
- **THEN** the record's `syncStatus` is set to `"synced"`

#### Scenario: Server-rejected record has rejected status
- **WHEN** server rejects a record with unhealable error
- **THEN** the record's `syncStatus` is set to `"rejected"`

#### Scenario: Editing a rejected record resets to pending
- **WHEN** user edits a record with `syncStatus: "rejected"`
- **THEN** `syncStatus` is reset to `"pending"`

### Requirement: Dexie migration from needsSync to syncStatus
Dexie database SHALL migrate from `needsSync: boolean` to `syncStatus` enum in a new version. Records with `needsSync: true` SHALL become `syncStatus: "pending"`. Records with `needsSync: false` SHALL become `syncStatus: "synced"`.

#### Scenario: Migration converts true to pending
- **WHEN** database upgrades and a task has `needsSync: true`
- **THEN** the task's `syncStatus` becomes `"pending"`

#### Scenario: Migration converts false to synced
- **WHEN** database upgrades and a task has `needsSync: false`
- **THEN** the task's `syncStatus` becomes `"synced"`
