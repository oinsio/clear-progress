# Capability: Project Paused Detection

## Purpose

Detects when the Supabase project is paused (HTTP 540), surfaces a user-friendly dialog with restore instructions, and auto-recovers when the project comes back online.

## Requirements

### Requirement: ProjectPausedError type exists in contract
The contract package SHALL export a `ProjectPausedError` error class that extends `Error`. It SHALL be used to signal that the Supabase project is paused (HTTP 540).

#### Scenario: ProjectPausedError is distinguishable from other errors
- **WHEN** an error is thrown as `ProjectPausedError`
- **THEN** it can be detected via `instanceof ProjectPausedError`

### Requirement: SyncStatus includes project_paused value
The `SyncStatus` type SHALL include `"project_paused"` as a valid value alongside existing values (`idle`, `syncing`, `offline`, `error`, `unauthorized`).

#### Scenario: project_paused is a valid SyncStatus
- **WHEN** `syncStatus` is set to `"project_paused"`
- **THEN** TypeScript accepts it as a valid `SyncStatus` value

### Requirement: ProjectPausedDialog shows instructions to user
When `syncStatus` is `"project_paused"`, the system SHALL display a `ProjectPausedDialog` with: title explaining the project is paused, text explaining how to restore, a button linking to Supabase Dashboard (`https://supabase.com/dashboard/projects`), and a close button.

#### Scenario: Dialog shown when project is paused
- **WHEN** `syncStatus` becomes `"project_paused"`
- **THEN** `ProjectPausedDialog` is displayed

#### Scenario: Dialog contains restore instructions
- **WHEN** `ProjectPausedDialog` is shown
- **THEN** it contains a link to Supabase Dashboard
- **AND** it explains that sync will resume automatically after restore

#### Scenario: Dialog closes without further action needed
- **WHEN** user clicks "Close" on the dialog
- **THEN** the dialog closes
- **AND** periodic sync continues to run in background

### Requirement: Sidebar shows project paused status
When `syncStatus` is `"project_paused"`, the sidebar sync block SHALL display a "Supabase paused" status indicator (`sync.projectPaused`: "Supabase paused" in `en.json`, «Supabase приостановлен» in `ru.json`).

#### Scenario: Sidebar displays paused status
- **WHEN** `syncStatus` is `"project_paused"`
- **THEN** sidebar sync block shows "Supabase paused" text with appropriate icon

#### Scenario: Dialog wording unchanged
- **WHEN** the paused-status wording is updated
- **THEN** `projectPausedDialog.*` and `settings.server.*` values remain byte-identical to before

### Requirement: Sync automatically recovers after project restore
After the user restores the project via Supabase Dashboard, the periodic auto-sync (running every `SYNC_INTERVAL_MS`) SHALL automatically detect that the project is alive and return `syncStatus` to `"idle"`.

#### Scenario: Auto-recovery after restore
- **WHEN** project was paused and user restores it
- **AND** periodic sync timer fires
- **THEN** sync succeeds
- **AND** `syncStatus` becomes `"idle"`
