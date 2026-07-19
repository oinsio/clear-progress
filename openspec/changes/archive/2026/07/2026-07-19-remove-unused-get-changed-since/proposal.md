# remove-unused-get-changed-since

## Why

The `getChangedSince(since)` method exists on all eight client repositories (Context, Category, Attachment, Task, Idea, Goal, Settings, Checklist) but is never called from production code. It is a leftover of an old delta-sync scheme ("pull everything changed after timestamp X"). The current sync protocol pulls the full server set and reconciles locally via `getNeedingSync()` + `applyServerRecords()` (the `syncStatus: pending` + LWW model), so `getChangedSince` is dead surface area that the IDE flags as unused and that new contributors mistake for live sync code.

## What Changes

- **REMOVED**: `getChangedSince(since)` method from all eight repositories: `ContextRepository`, `CategoryRepository`, `AttachmentRepository`, `TaskRepository`, `IdeaRepository`, `GoalRepository`, `SettingsRepository`, `ChecklistRepository`.
- **REMOVED**: the tests that only exercise `getChangedSince` — the `getChangedSince` describe blocks in `TaskRepository.sync.test.ts` and `ChecklistRepository.queries.test.ts`, the whole `SettingsRepository.sync.test.ts` (it tests only `getChangedSince`), and the "Filter settings by updated_at" scenario in `settings_repository_sync_flags.feature` plus its step definition.
- **REMOVED**: the five `getChangedSince` mock stubs in `attachmentRepositoryMock.ts`, `createRepositoryMock.ts`, `taskRepositoryMock.ts`, `settings_service.steps.ts`, and `day_boundary_validation.steps.ts`.
- **MODIFIED** (spec): remove the "retrieve settings with `updated_at` strictly greater than a given timestamp" requirement and its "Filter settings by updated_at" scenario from `specs/settings/spec.md`.
- Not a breaking change for users: no production caller and no public API surface consumes the method.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `settings`: remove the requirement that the settings repository provide a `getChangedSince`-style "changed since timestamp" query. No other capability references `getChangedSince` at the spec level.

## Impact

- **Code**: 8 files under `packages/client/src/db/repositories/*Repository.ts` (method removed).
- **Tests**: `TaskRepository.sync.test.ts`, `ChecklistRepository.queries.test.ts` (one describe block each removed), `SettingsRepository.sync.test.ts` (file deleted), `settings_repository_sync_flags.feature` + `settings_repository_sync_flags.steps.ts` (one scenario/step removed), 5 mock files (one stub each removed): `createRepositoryMock.ts`, `taskRepositoryMock.ts`, `attachmentRepositoryMock.ts`, `settings_service.steps.ts`, `day_boundary_validation.steps.ts`.
- **Specs**: `openspec/specs/settings/spec.md` (one requirement + scenario removed).
- **Runtime behavior**: none — no production code path calls the method, sync flow is unchanged.

## Goals

- G1: Zero `getChangedSince` definitions remain in `packages/client/src` after the change.
- G2: Client build and the full unit/BDD test suite stay green with no references to `getChangedSince`.

## Non-Goals

- NG1: Changing the active sync protocol (`getNeedingSync` + `applyServerRecords`) in any way.
- NG2: Touching the GAS/Supabase backends or any server-side `updated_at` query.
- NG3: Removing the `updated_at` index/field or any other repository query method.

## Users & Scenarios

- U1: Maintainer reads a repository and is not misled by a sync method that nothing calls.
- U2: IDE/linter no longer reports `getChangedSince` as unused dead code.

## Requirements

### Functional

- FR1: The `getChangedSince` method MUST be absent from all eight client repositories after this change.
- FR2: The settings spec MUST NOT require a "changed since timestamp" query capability after this change.
- FR3: All remaining repository methods (`getAll`, `getActive`, `getById`, `create`, `update`, `bulkUpsert`, `getNeedingSync`, `applyServerRecords`, and entity-specific queries) MUST be unchanged and still covered by their existing tests.

### Non-Functional

#### Performance

- NFR-P1: No change to sync or query runtime performance (pure removal of an uncalled method).

## Success Metrics

- M1: `grep -rn "getChangedSince" packages/client/src` (excluding `.stryker-tmp`) returns 0 matches.
- M2: Client build passes and the unit/BDD test suite passes with 0 failures.

## Affected IA

No changes.

## Open Questions

_None._
