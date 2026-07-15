# local-db-schema spec

## Purpose

Defines how the client-side IndexedDB (Dexie) database declares its schema. The database uses a single baseline schema version with no migration history, reflecting the app's pre-production state where no persisted data needs to be migrated.

## Requirements

### Requirement: Single baseline schema version
The IndexedDB (Dexie) database SHALL declare its schema through exactly one `version(1).stores(...)` call using the current schema (the `syncStatus`-based schema). No higher version numbers and no incremental version history SHALL exist while the app is pre-production.

#### Scenario: Database opens with version 1
- **WHEN** the application instantiates the database on a device with no existing IndexedDB
- **THEN** the database is created at schema version 1
- **AND** all stores (`tasks`, `goals`, `contexts`, `categories`, `checklist_items`, `ideas`, `settings`, `files`, `pending_files`, `attachments`, `sync_meta`) exist with their indexes

#### Scenario: Sync-state records are queryable by syncStatus
- **WHEN** a record with a `syncStatus` value is stored in any entity table
- **THEN** it can be queried through the `syncStatus` index
- **AND** no `needsSync` index exists on any table

### Requirement: No migration callbacks
The database definition SHALL NOT contain any `.upgrade()` migration callback. Because the app is pre-production, the schema is treated as a fresh baseline with no data to migrate.

#### Scenario: Opening a fresh database runs no migration
- **WHEN** the database is opened for the first time
- **THEN** no upgrade/migration logic executes
- **AND** records are written with `syncStatus` directly, never derived from a legacy `needsSync` flag

### Requirement: Single schema export
The schema module SHALL export exactly one schema object (`DB_SCHEMA`) describing the store definitions. Legacy exports (`DB_SCHEMA_V1`, `DB_SCHEMA_V2`, and the deprecated `DB_SCHEMA` alias pointing at V1) SHALL be removed, along with the obsolete `needsSync` index.

#### Scenario: Only the baseline schema is exported
- **WHEN** a module imports the database schema
- **THEN** it imports a single `DB_SCHEMA` object
- **AND** no versioned schema variants (`DB_SCHEMA_V1`, `DB_SCHEMA_V2`) are exported
- **AND** `DB_SCHEMA` contains the `syncStatus` index and does not contain a `needsSync` index
