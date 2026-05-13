# Tasks: spec-sync-protocol

Retrospective documentation — the code is already implemented. Tasks focus on syncing specs to main specs, auditing test coverage, and writing missing tests.

## 1. Sync specs to main

- [x] 1.1 Sync `specs/sync-protocol/spec.md` to `openspec/specs/sync-protocol/spec.md` (FR1-FR7, FR12-FR15)
- [x] 1.2 Sync `specs/cover-sync-protocol/spec.md` to `openspec/specs/cover-sync-protocol/spec.md` (FR8-FR11)

## 2. Audit existing contract tests

- [x] 2.1 Check contract test coverage in `packages/contract/tests/contracts/` — map each test to scenarios from specs (FR1-FR15)
- [x] 2.2 Compile gap analysis: which spec scenarios are not covered by contract tests

## 3. Audit existing unit tests (SyncService)

- [x] 3.1 Check unit test coverage for `SyncService.ts` — map to push/pull/dirty flag scenarios (FR1, FR4, FR5, FR6, FR13, FR14)
- [x] 3.2 Check unit test coverage for `CoverSyncService.ts` — map to cover lifecycle scenarios (FR8-FR11)
- [x] 3.3 Compile gap analysis: which scenarios are not covered by unit tests

## 3.5. Add missing unit tests (gap analysis from 3.3)

### SyncService.ts gaps

- [x] 3.5.1 SyncService: FR1 — test `push(force = true)` collects all records regardless of needsSync
  - Should call `getAll()` instead of `getNeedingSync()`
  - Should include both dirty and clean records in push payload
- [x] 3.5.2 SyncService: FR5 — test pull detects purge_revision change and purges local deleted records
  - When `pullResponse.purge_revision > localPurgeRevision`
  - Should call `_purgeLocalDeletedRecords()`
  - Should update `LAST_KNOWN_PURGE_REVISION` in sync_meta
- [x] 3.5.3 SyncService: FR6 — test push includes soft-deleted records (is_deleted = true)
  - Records with `is_deleted = true` and `needsSync = true` must be in push payload
  - Verify server receives soft-deleted records

### CoverSyncService.ts gaps

- [x] 3.5.4 CoverSyncService: FR8 — test deduplication handling (reused: true response)
  - Mock `uploadCovers` to return `{ file_id: "existing-id", reused: true }`
  - Verify goal is updated with existing `file_id` (not a new one)
  - Verify pending cover is deleted after dedup
- [x] 3.5.5 CoverSyncService: FR11 — investigate cover deletion with reference counting
  - Investigation result: FR11 is implemented in `CoverService.deleteCover()`, not `CoverSyncService`
  - Deletion is a goal-lifecycle operation, not a sync-cycle operation — architecturally correct
  - Tests exist in `CoverService.test.ts`: local pending delete, server delete (ref_count=0), keep (ref_count>0)
  - Added JSDoc note in `CoverSyncService` pointing to `CoverService.deleteCover`

## 4. BDD unit tests for sync protocol

- [x] 4.1 Write Gherkin feature `sync-push.feature` with tags `@spec-sync-protocol @FR1 @FR3 @FR15` — push scenarios: dirty records, force push, push results (created/accepted/conflict/rejected)
- [x] 4.2 Write step definitions for `sync-push.feature`
- [x] 4.3 Write Gherkin feature `sync-pull.feature` with tags `@spec-sync-protocol @FR2 @FR5 @FR13` — pull scenarios: incremental, full, dirty flag protection
- [x] 4.4 Write step definitions for `sync-pull.feature`
- [x] 4.5 Write Gherkin feature `sync-dirty-flag.feature` with tags `@spec-sync-protocol @FR4` — dirty flag lifecycle: set/clear/preserve
- [x] 4.6 Write step definitions for `sync-dirty-flag.feature`
- [x] 4.7 Write Gherkin feature `sync-conflict.feature` with tags `@spec-sync-protocol @FR3` — LWW conflict resolution
- [x] 4.8 Write step definitions for `sync-conflict.feature`
- [x] 4.9 Write Gherkin feature `sync-soft-delete.feature` with tags `@spec-sync-protocol @FR6` — soft delete and purge
- [x] 4.10 Write step definitions for `sync-soft-delete.feature`

## 5. BDD unit tests for cover sync protocol

- [x] 5.1 Write Gherkin feature `cover-upload.feature` with tags `@spec-sync-protocol @FR8 @FR9` — single upload, batch, dedup, validation
- [x] 5.2 Write step definitions for `cover-upload.feature`
- [x] 5.3 Write Gherkin feature `cover-lifecycle.feature` with tags `@spec-sync-protocol @FR10 @FR11` — download, delete, local lifecycle, full sync reupload
- [x] 5.4 Write step definitions for `cover-lifecycle.feature`

## 6. Additional contract tests (gap analysis from 2.2)

- [x] 6.1 FR3: Client wins with newer timestamp (accepted, not conflict)
- [x] 6.2 FR3: Equal timestamps — client wins (>= comparison)
- [x] 6.3 FR15: `accepted` status on update of existing record with newer timestamp
- [x] 6.4 FR15: `rejected` status — invalid UUID, blank name, invalid box
- [x] 6.5 FR2: Pull response `current_revision` reflects latest push revision
- [x] 6.6 FR7: Settings conflict resolution (push older timestamp → conflict)
- [x] 6.7 FR8: SHA-256 deduplication (`reused: true` on duplicate hash)
- [x] 6.8 FR9: Partial batch failure (1 of N covers fails)
- [x] 6.9 FR9: Batch size limit (>10 items rejected)
- [x] 6.10 FR10: Missing cover returns error per item
- [x] 6.11 FR11: Reference counting — shared cover not deleted, `ref_count` decremented
- [x] 6.12 Run contract tests on in-memory adapter: `pnpm --filter contract test`

## 6.5 Test coverage for new requirements (FR16-FR19)

### FR16: Chunked push

- [x] 6.5.1 Verify SyncService chunked push implementation exists — check `SyncService.ts` for chunk splitting logic
  - Result: chunked push NOT implemented — current code sends all records in single request
- [x] 6.5.2 Write unit tests: push splits into chunks when >200 records, single request when <=200
  - Created `sync_chunked_push.feature` with 5 scenarios
  - Created `sync_chunked_push.steps.ts` with step definitions
  - Tests are RED (failing as expected) — 6 failures, 13 passes
- [x] 6.5.3 Write unit test: chunk failure stops remaining chunks, failed records retain needsSync
  - Covered in scenario "Chunk failure stops remaining chunks"

### FR17: Lock timeout

- [x] 6.5.4 Write contract test: server returns `SYNC_LOCK_TIMEOUT` when lock unavailable
- [x] 6.5.5 Write unit test: SyncService handles `SYNC_LOCK_TIMEOUT` — records retain needsSync for retry

### FR18: Reorder optimization

- [x] 6.5.6 Verify reorder methods (reorderTasks, reorderGoals) compare sort_order before marking needsSync
- [x] 6.5.7 Write unit tests: only changed sort_order records are marked dirty; no-op reorder writes nothing

### FR19: Settings no-op optimization

- [x] 6.5.8 Verify SettingsRepository.set() compares before writing
- [x] 6.5.9 Write unit tests: same value skips put(), changed value triggers put() and needsSync

## 7. Mutation testing — kill survived mutants

Source: `mutation-analysis.md` (SyncService 85.6%, CoverSyncService 80.1%). Target >=95%, minimum >=90%.

### 7.1 Type A: strengthen assertions in existing scenarios

- [ ] 7.1.1 `sync_soft_delete.feature`: "Pull does not purge when purge_revision unchanged" — assert specific tables, not just generic "not hard-deleted"
- [ ] 7.1.2 `sync_soft_delete.feature`: "Pull detects server purge" — assert non-deleted records survive purge (kills `() => undefined` mutant)
- [ ] 7.1.3 `cover_upload.feature`: "Duplicate cover detected by hash" — assert reupload does NOT happen, not just that file_id matches
- [ ] 7.1.4 `cover_lifecycle.feature`: "Full sync reupload updates goal" — assert exact version value (`version = old + 1`), not just "incremented"

### 7.2 Type B: new scenarios for SyncService (11 scenarios)

#### `sync_pull.feature` — +3 scenarios

- [ ] 7.2.1 FR5: Settings updated_at tie-breaking when timestamps are equal
- [ ] 7.2.2 FR5: Settings updated_at fallback — not updated when pull returns no settings
- [ ] 7.2.3 FR2: Pull dispatches `sync_complete` CustomEvent after applying records

#### `sync_push.feature` — +3 scenarios

- [ ] 7.2.4 FR1: Force push sends records even when nothing is dirty
- [ ] 7.2.5 FR1: Push with empty results array does not throw
- [ ] 7.2.6 FR1: Push handles partial response with missing entity arrays

#### `sync_conflict.feature` — +2 scenarios

- [ ] 7.2.7 FR3: Client record is not overwritten when local timestamp is newer
- [ ] 7.2.8 FR3: Server record wins when timestamps are equal

#### `sync_soft_delete.feature` — +2 scenarios

- [ ] 7.2.9 FR6: Purge does not delete records that are not soft-deleted
- [ ] 7.2.10 FR6: Full sync resets needsSync to false before pulling

### 7.3 Type B: new scenarios for CoverSyncService (7 scenarios)

#### `cover_lifecycle.feature` — +4 scenarios

- [ ] 7.3.1 FR11: Initialization skips covers without blob data
- [ ] 7.3.2 FR10: Download skips when result has error flag despite having file_id
- [ ] 7.3.3 FR10: Download uses fallback MIME type when server omits mime_type
- [ ] 7.3.4 FR11: Full sync reupload version is incremented not decremented

#### `cover_upload.feature` — +2 scenarios

- [ ] 7.3.5 FR9: Batch does not produce extra empty iteration on exact boundary
- [ ] 7.3.6 FR9: Upload skips result with error flag even when file_id is present

#### `cover_base64.feature` — new file, +1 scenario

- [ ] 7.3.7 FR10: Base64 string is correctly decoded to Uint8Array

### 7.4 Run and verify

- [ ] 7.4.1 Run `pnpm run test:mutation` on SyncService and CoverSyncService
- [ ] 7.4.2 Verify mutation score >=90% (target >=95%)

## 8. Verification

- [ ] 8.1 `pnpm run build` — build passes
- [ ] 8.2 `pnpm test` — all tests green
- [ ] 8.3 Verify traceability: every FR from proposal has at least one test with a corresponding tag/comment

---

## 9. Recommendations from coverage analysis

### Repository-level verification (FR4, FR13)

- [x] 9.1 Verify FR4 (dirty flag lifecycle) is covered in repository tests
  - `hasEntityChanged()` logic: 14 tests in `deepEqual.test.ts` — real change, no-op, empty string ≡ undefined, null ≡ empty, metadata excluded ✅
  - Services set `needsSync: hasChanged` — consistent pattern in all 6 services ✅
  - Repositories don't manage dirty flag — it's a service responsibility ✅
- [x] 9.2 Verify FR13 (pull protection) is covered in `applyServerRecords()` tests
  - `TaskRepository.test.ts` lines 386-428: all 3 scenarios covered ✅
  - Clean local record overwritten by server (line 398) ✅
  - Dirty local record (`needsSync = true`) preserved (line 414) ✅
  - New server record inserted (line 387) ✅

### Additional test quality improvements

- [x] 9.3 CoverSyncService: add explicit test for batch size enforcement
  - Client chunking: explicitly tested in `CoverSyncService.test.ts` (line 376, 391) — `MAX_COVER_BATCH_SIZE` ✅
  - Server rejection: tested in `upload-covers.test.ts` (line 59) and `get-cover.test.ts` (line 72) ✅
  - Already explicitly covered, no additional test needed
- [x] 9.4 Review test quality notes from analysis files
  - SyncService: mutex, error handling, settings sync, push results — already well covered ✅
  - CoverSyncService: concurrency, error handling, edge cases, batch processing, cache — already well covered ✅

### Documentation

- [x] 9.5 If FR11 (cover deletion) is implemented elsewhere, document the location
  - JSDoc already added in `CoverSyncService.ts:25` pointing to `CoverService.deleteCover` ✅
  - FR11 is a goal-lifecycle operation, not sync-cycle — architecturally correct
