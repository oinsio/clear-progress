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

## 7. Mutation testing

- [ ] 7.1 Run `pnpm run test:mutation` on SyncService and CoverSyncService
- [ ] 7.2 Analyze survived mutants and write additional tests for coverage
- [ ] 7.3 Bring mutation score to >=90% (target >=95%)

## 8. Verification

- [ ] 8.1 `pnpm run build` — build passes
- [ ] 8.2 `pnpm test` — all tests green
- [ ] 8.3 Verify traceability: every FR from proposal has at least one test with a corresponding tag/comment

---

## 9. Recommendations from coverage analysis

### Repository-level verification (FR4, FR13)

- [ ] 9.1 Verify FR4 (dirty flag lifecycle) is covered in repository tests
  - `hasEntityChanged()` logic: real change sets dirty flag
  - No-op change does not set dirty flag
  - Empty string equals undefined in comparison
- [ ] 9.2 Verify FR13 (pull protection) is covered in `applyServerRecords()` tests
  - Clean local record is overwritten by server
  - Dirty local record (`needsSync = true`) is preserved
  - New server record is inserted

### Additional test quality improvements

- [ ] 9.3 CoverSyncService: add explicit test for batch size enforcement
  - Verify behavior when batch > MAX_COVER_BATCH_SIZE
  - Currently only tested implicitly via chunking
- [ ] 9.4 Review test quality notes from analysis files
  - SyncService: mutex, error handling, settings sync, push results — already well covered ✅
  - CoverSyncService: concurrency, error handling, edge cases, batch processing, cache — already well covered ✅

### Documentation

- [ ] 9.5 If FR11 (cover deletion) is implemented elsewhere, document the location
  - Add comment in CoverSyncService pointing to deletion logic
  - Or add to architecture docs if it's a cross-cutting concern
