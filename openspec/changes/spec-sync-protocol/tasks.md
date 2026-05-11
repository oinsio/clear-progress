# Tasks: spec-sync-protocol

Retrospective documentation — the code is already implemented. Tasks focus on syncing specs to main specs, auditing test coverage, and writing missing tests.

## 1. Sync specs to main

- [ ] 1.1 Sync `specs/sync-protocol/spec.md` to `openspec/specs/sync-protocol/spec.md` (FR1-FR7, FR12-FR15)
- [ ] 1.2 Sync `specs/cover-sync-protocol/spec.md` to `openspec/specs/cover-sync-protocol/spec.md` (FR8-FR11)

## 2. Audit existing contract tests

- [ ] 2.1 Check contract test coverage in `packages/contract/tests/contracts/` — map each test to scenarios from specs (FR1-FR15)
- [ ] 2.2 Compile gap analysis: which spec scenarios are not covered by contract tests

## 3. Audit existing unit tests (SyncService)

- [ ] 3.1 Check unit test coverage for `SyncService.ts` — map to push/pull/dirty flag scenarios (FR1, FR4, FR5, FR6, FR13, FR14)
- [ ] 3.2 Check unit test coverage for `CoverSyncService.ts` — map to cover lifecycle scenarios (FR8-FR11)
- [ ] 3.3 Compile gap analysis: which scenarios are not covered by unit tests

## 4. BDD unit tests for sync protocol

- [ ] 4.1 Write Gherkin feature `sync-push.feature` with tags `@spec-sync-protocol @FR1 @FR3 @FR15` — push scenarios: dirty records, force push, push results (created/accepted/conflict/rejected)
- [ ] 4.2 Write step definitions for `sync-push.feature`
- [ ] 4.3 Write Gherkin feature `sync-pull.feature` with tags `@spec-sync-protocol @FR2 @FR5 @FR13` — pull scenarios: incremental, full, dirty flag protection
- [ ] 4.4 Write step definitions for `sync-pull.feature`
- [ ] 4.5 Write Gherkin feature `sync-dirty-flag.feature` with tags `@spec-sync-protocol @FR4` — dirty flag lifecycle: set/clear/preserve
- [ ] 4.6 Write step definitions for `sync-dirty-flag.feature`
- [ ] 4.7 Write Gherkin feature `sync-conflict.feature` with tags `@spec-sync-protocol @FR3` — LWW conflict resolution
- [ ] 4.8 Write step definitions for `sync-conflict.feature`
- [ ] 4.9 Write Gherkin feature `sync-soft-delete.feature` with tags `@spec-sync-protocol @FR6` — soft delete and purge
- [ ] 4.10 Write step definitions for `sync-soft-delete.feature`

## 5. BDD unit tests for cover sync protocol

- [ ] 5.1 Write Gherkin feature `cover-upload.feature` with tags `@spec-sync-protocol @FR8 @FR9` — single upload, batch, dedup, validation
- [ ] 5.2 Write step definitions for `cover-upload.feature`
- [ ] 5.3 Write Gherkin feature `cover-lifecycle.feature` with tags `@spec-sync-protocol @FR10 @FR11` — download, delete, local lifecycle, full sync reupload
- [ ] 5.4 Write step definitions for `cover-lifecycle.feature`

## 6. Additional contract tests

- [ ] 6.1 Write missing contract tests based on gap analysis from 2.2 (if any)
- [ ] 6.2 Run contract tests on in-memory adapter: `pnpm --filter contract test`

## 7. Mutation testing

- [ ] 7.1 Run `pnpm run test:mutation` on SyncService and CoverSyncService
- [ ] 7.2 Analyze survived mutants and write additional tests for coverage
- [ ] 7.3 Bring mutation score to >=90% (target >=95%)

## 8. Verification

- [ ] 8.1 `pnpm run build` — build passes
- [ ] 8.2 `pnpm test` — all tests green
- [ ] 8.3 Verify traceability: every FR from proposal has at least one test with a corresponding tag/comment
