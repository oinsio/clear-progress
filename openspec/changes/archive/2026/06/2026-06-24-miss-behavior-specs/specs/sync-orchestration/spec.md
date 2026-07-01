## MODIFIED Requirements

### Requirement: SyncProvider traceability

SyncProvider.tsx SHALL reference sync-orchestration spec (triggers T1-T7, preconditions, error handling, cleanup) as its primary traceability link. The secondary reference to localstorage-refactor FR6, FR7 (usePreference for lastSyncedAt) SHALL be preserved. Implements FR7 of miss-behavior-specs.

#### Scenario: SyncProvider references sync-orchestration spec
- **WHEN** a developer reads SyncProvider.tsx
- **THEN** the file-level comment references sync-orchestration spec triggers T1-T7
- **AND** the comment also references localstorage-refactor FR6, FR7 for localStorage integration
