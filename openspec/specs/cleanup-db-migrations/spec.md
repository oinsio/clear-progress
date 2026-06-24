# cleanup-db-migrations spec

## REMOVED Requirements

### Requirement: Database version migration chain
**Reason**: v2 (covers→files rename) and v3 (integer→fractional sort_order) upgrade blocks are dead code — no production users exist on v1 or v2.
**Migration**: Not required. Developers clear IndexedDB once via DevTools.

### Requirement: Legacy connection localStorage migration
**Reason**: Deprecated keys `GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED` are not used in active code. Migration to `CONNECTION_CONFIG` was only needed for transitioning between versions during development.
**Migration**: Not required — all configs are already in the `CONNECTION_CONFIG` format.

## ADDED Requirements

### Requirement: Single-version database schema
The system SHALL create IndexedDB via a single `version(1)` with the sole schema `DB_SCHEMA`, containing all 11 tables: tasks, goals, contexts, categories, checklist_items, ideas, settings, files, pending_files, attachments, sync_meta.

#### Scenario: Fresh database creation
- **WHEN** the application starts for the first time (no existing DB)
- **THEN** a DB with version 1 is created with all 11 tables and correct indexes

#### Scenario: No upgrade callbacks exist
- **WHEN** the `ClearProgressDatabase` constructor is called
- **THEN** exactly one `version()` call is made with no `.upgrade()` chaining
