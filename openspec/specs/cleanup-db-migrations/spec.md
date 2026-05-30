# cleanup-db-migrations spec

## REMOVED Requirements

### Requirement: Database version migration chain
**Reason**: Project is not in production, no users with intermediate DB versions exist. All 9 versions and 6 upgrade blocks are dead code.
**Migration**: DB is created with `version(1)` and the final schema. Developers must clear IndexedDB in the browser.

### Requirement: Legacy connection localStorage migration
**Reason**: Deprecated keys `GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED` are not used in active code. Migration to `CONNECTION_CONFIG` was only needed for transitioning between versions during development.
**Migration**: Not required — all configs are already in the `CONNECTION_CONFIG` format.

## ADDED Requirements

### Requirement: Single-version database schema
The system SHALL create IndexedDB via a single `version(1)` with the sole schema `DB_SCHEMA`, containing all 10 tables: tasks, goals, contexts, categories, checklist_items, ideas, settings, covers, pending_covers, sync_meta.

#### Scenario: Fresh database creation
- **WHEN** the application starts for the first time (no existing DB)
- **THEN** a DB with version 1 is created with all 10 tables and correct indexes
