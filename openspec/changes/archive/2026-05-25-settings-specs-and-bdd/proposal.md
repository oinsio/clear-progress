# Settings Specs and BDD

## Why

The settings functionality (synced and local-only preferences) is fully implemented but lacks formal specifications and BDD tests. Other domain entities (tasks, goals, ideas, contexts, categories) have dedicated openspec specs and feature files. Settings is a gap in documentation coverage, making it harder to verify behavior correctness and detect regressions.

## What Changes

- **ADDED**: OpenSpec capability spec for application settings (synced settings: default_box, accent_color, custom colors)
- **ADDED**: OpenSpec capability spec for local preferences (color_scheme, panel settings, interface scale, focus mode, filter bar position, language)
- **ADDED**: BDD feature files covering settings domain logic and sync behavior
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every settings behavior has a formal specification in openspec
- G2: BDD feature files cover all settings domain rules (repository, service, hooks)
- G3: Close the documentation gap between settings and other domain entities

## Non-Goals

- NG1: No changes to settings implementation code
- NG2: No E2E/Playwright tests (settings sync E2E already exists)
- NG3: No UI component tests for SettingsPage (already covered)
- NG4: No changes to menu-order spec (already exists separately)

## Users & Scenarios

- U1: Developer maintaining settings code — uses specs as reference for expected behavior
- U2: AI agent implementing new settings — uses specs to understand patterns and constraints

## Requirements

### Functional

- FR1: Spec documents synced settings CRUD operations (get, set with needsSync flag)
- FR2: Spec documents conflict resolution for synced settings (local dirty wins, server newer wins)
- FR3: Spec documents bulk upsert behavior during pull
- FR4: Spec documents local preferences read/write (localStorage-only settings)
- FR5: Spec documents default values and type constraints for all settings
- FR6: BDD scenarios cover SettingsRepository operations (read, set, sync, bulkUpsert)
- FR7: BDD scenarios cover SettingsService business logic
- FR8: BDD scenarios cover local preference hooks behavior

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/settings/settings_repository_read.feature` — @settings-specs-and-bdd @FR1
- `features/settings/settings_repository_write.feature` — @settings-specs-and-bdd @FR1 @FR5
- `features/settings/settings_repository_sync.feature` — @settings-specs-and-bdd @FR2 @FR3
- `features/settings/settings_service.feature` — @settings-specs-and-bdd @FR7
- `features/settings/settings_local_preferences.feature` — @settings-specs-and-bdd @FR4 @FR8

## Affected IA

No changes.

## Success Metrics

- M1: 100% of synced settings behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: Mutation score >=90% on settings repository and service code

## Open Questions

- Q1: Should local preferences (localStorage-only) be a separate capability spec or part of a single settings spec?

## Capabilities

### New Capabilities

- `settings`: Synced application settings — CRUD, conflict resolution, bulk upsert, default values, type constraints
- `local-preferences`: Local-only preferences — color scheme, panel settings, interface scale, focus mode, language, filter bar position

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/settings/spec.md`, `openspec/specs/local-preferences/spec.md`
- New feature files: 5 files under `packages/client/src/test/features/settings/`
- New step definitions: corresponding `.steps.ts` files
- No changes to existing implementation code
