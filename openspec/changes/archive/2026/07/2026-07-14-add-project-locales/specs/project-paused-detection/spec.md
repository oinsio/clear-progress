# Capability: project-paused-detection (delta)

Wording change only: the sidebar paused status names Supabase explicitly so it cannot be read as referring to a GTD project/goal. Detection, dialog, and recovery behavior are unchanged.

## MODIFIED Requirements

### Requirement: Sidebar shows project paused status
When `syncStatus` is `"project_paused"`, the sidebar sync block SHALL display a "Supabase paused" status indicator (`sync.projectPaused`: "Supabase paused" in `en.json`, «Supabase приостановлен» in `ru.json`).

#### Scenario: Sidebar displays paused status
- **WHEN** `syncStatus` is `"project_paused"`
- **THEN** sidebar sync block shows "Supabase paused" text with appropriate icon

#### Scenario: Dialog wording unchanged
- **WHEN** the paused-status wording is updated
- **THEN** `projectPausedDialog.*` and `settings.server.*` values remain byte-identical to before
