## 1. Contract Layer (packages/contract/) — FR1, FR2, FR3, FR4

- [x] 1.1 Rename `cover_file_id` to `cover_hash` in `WireGoalSchema` (`src/schemas/entities.ts`)
- [x] 1.2 Update cover protocol types: `UploadCoverResponse` (`file_id` -> `data_hash`), `GetCoverRequest` (`file_ids` -> `hashes`), `GetCoverResponse` result keyed by `hash`, `DeleteCoverRequest` (`file_id` -> `hash`) (`src/protocol/cover.ts`)
- [x] 1.3 Update Zod response schemas in `src/schemas/api.ts` to match new protocol types
- [x] 1.4 Update contract tests: test data and assertions for `cover_hash` and hash-based cover API (`tests/contracts/sync-adapter.contract.ts`)
- [x] 1.5 Verify contract package builds: `pnpm --filter @clear-progress/contract run build`

## 2. Client: Types, DB Schema, Repositories — FR5, FR6, FR8

- [x] 2.1 Update `CoverRecord` (PK = `data_hash`, remove `file_id`) and `PendingCoverRecord` (PK = `data_hash`, remove `local_id`) in `src/types/entities.ts`
- [x] 2.2 Add new DB schema version: `covers: "data_hash"`, `pending_covers: "data_hash, goal_id"` in `src/db/schema.ts`
- [x] 2.3 Update Dexie database class with new version migration: re-key covers, migrate goals `cover_file_id` -> `cover_hash` (`src/db/database.ts`)
- [x] 2.4 Update `CoverRepository`: PK = `data_hash`, remove `getByFileId` (`src/db/repositories/CoverRepository.ts`)
- [x] 2.5 Update `PendingCoverRepository`: PK = `data_hash`, remove `local_id` operations (`src/db/repositories/PendingCoverRepository.ts`)
- [x] 2.6 Update repository tests for new PK structure

## 3. Client: Services — FR5, FR6, FR7

- [x] 3.1 Update `CoverService`: remove `LOCAL_COVER_ID_PREFIX` logic, work with hash throughout (`src/services/CoverService.ts`)
- [x] 3.2 Update `CoverSyncService`: remove file_id mapping from `handleSuccessfulUpload`, simplify `reuploadLocalCovers`, update `ensureServerCoversAreCached` to use `cover_hash` (`src/services/CoverSyncService.ts`)
- [x] 3.3 Update `LocalCoverCache`: keys = hash, remove `transfer()` method (`src/services/LocalCoverCache.ts`)
- [x] 3.4 Update `GoalService`: `cover_file_id: ""` -> `cover_hash: ""` (`src/services/GoalService.ts`)
- [x] 3.5 Remove `LOCAL_COVER_ID_PREFIX` from constants (`src/constants/index.ts`)
- [x] 3.6 Update all CoverSyncService tests (5 test files) and CoverService tests
- [x] 3.7 Update GoalService tests, SyncService tests, test helpers, and test factories (`goalFactory`)

## 4. Client: Hooks and UI — FR1

- [x] 4.1 Update `useCoverUrl` hook: parameter `coverHash` instead of `fileId` (`src/hooks/useCoverUrl.ts`)
- [x] 4.2 Rename `goal.cover_file_id` -> `goal.cover_hash` across all UI components (~29 files: GoalItem, GoalDetailPage, GoalPage, FocusedGoalNavItem, FocusGoalReplacementDialog, etc.)
- [x] 4.3 Update UI component tests (GoalItem, FocusGoalReplacementDialog, etc.)
- [x] 4.4 Update BDD features and steps: `cover_lifecycle.feature`, `cover_upload.feature`, `sync_push.feature`

## 5. GAS Backend (packages/adapter-gas/) — FR7

- [x] 5.1 Rename `cover_file_id` -> `cover_hash` in Goal type (`src/server/types/index.ts`)
- [x] 5.2 Update sheet header constant: `"cover_file_id"` -> `"cover_hash"` (`src/server/helpers/constants.ts`)
- [x] 5.3 Update goals sheet: `getCoverFileIds()` -> `getCoverHashes()`, field mapping (`src/server/sheets/goals.sheet.ts`)
- [x] 5.4 Update `upload-cover` action: response returns `data_hash` instead of `file_id` (`src/server/actions/upload-cover.ts`)
- [x] 5.5 Update `upload-covers` action: batch results return `data_hash` (`src/server/actions/upload-covers.ts`)
- [x] 5.6 Update `get-cover` action: accept `hashes[]`, lookup files by `description` field (`src/server/actions/get-cover.ts`)
- [x] 5.7 Update `delete-cover` action: accept `hash`, find file by description (`src/server/actions/delete-cover.ts`)
- [x] 5.8 Add auto-migration in `init()`: detect old `cover_file_id` header, read hash from Drive file description, rename column
- [x] 5.9 Update all GAS backend tests

## 6. Supabase Backend (packages/adapter-supabase/) — FR7

- [x] 6.1 Create SQL migration: add `cover_hash TEXT`, populate from covers join, drop `cover_file_id` column
- [x] 6.2 Update push RPC function: goal upsert uses `cover_hash` TEXT (no UUID cast)
- [x] 6.3 Update `serializeGoalRow` in `_shared/serializers.ts`: `cover_hash` field
- [x] 6.4 Update `upload-cover` edge function: response returns `data_hash` instead of `file_id`
- [x] 6.5 Update `upload-covers` edge function: batch results return `data_hash`
- [x] 6.6 Update `get-cover` edge function: accept `hashes[]`, query by `(user_id, data_hash)`
- [x] 6.7 Update `delete-cover` edge function: accept `hash`, query by `(user_id, data_hash)`
- [x] 6.8 Update all Supabase backend tests

## 7. Integration Tests and Specs

- [x] 7.1 Update integration tests: covers-sync, goals-sync, multi-device-sync (`packages/integration/`)
- [x] 7.2 Run full test suite: `pnpm run test`
- [x] 7.3 Run build: `pnpm run build`

## 8. Documentation and Specs Sync

- [x] 8.1 Update `docs/architecture/data-model-and-sync.md`: `cover_hash` in Goal entity
- [x] 8.2 Update API docs and Bruno collections
- [ ] 8.3 Sync delta specs to main specs: `/opsx:sync`
