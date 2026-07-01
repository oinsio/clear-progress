## 1. Create purge spec and sync delta

- [x] 1.1 Create `openspec/specs/purge/spec.md` with requirements: strict confirmation, soft-deleted removal, PurgeResponse structure, purge_revision increment, error handling (FR1-FR5)
- [x] 1.2 Update `openspec/specs/sync-protocol/spec.md` — add cross-reference to purge spec in the "Purge hard-deletes soft-deleted records" requirement

## 2. Test verification

- [x] 2.1 Verify `purge.validation.test.ts` covers all scenarios from purge spec (strict confirm, truthy non-boolean, null, undefined) (FR6) — all 4 spec scenarios covered; `confirm: null` added to it.each
- [x] 2.2 Verify `purge.deletion.test.ts` covers deletion across all 6 entity types, "no soft-deleted records" scenario, purge_revision increment (FR6) — all covered; purge_revision increment tests added (from arbitrary value, and with no soft-deleted records)
- [x] 2.3 Verify `sync_soft_delete.feature` + steps cover client-side purge coordination (FR7) — all 3 client-side purge scenarios covered (pull detection + client purge + negative cases)
- [x] 2.4 Verify `sync-adapter.contract.ts` covers contract tests for purge (FR8) — full coverage: all 6 entity types, purge_revision with no records, non-deleted preservation
- [x] 2.5 Run `npx vitest run` in adapter-gas and client — all tests green (M2) — adapter-gas: 698 tests passed; client: 3424 tests passed
- [x] 2.6 Build traceability matrix: requirement -> test (M3)

## 3. Test gap fixes

- [x] 3.1 Add `confirm: null` to `purge.validation.test.ts` it.each — `purge-test-utils.ts` already exported needed mocks
- [x] 3.2 Add `purge_revision` increment tests to `purge.deletion.test.ts` — tests for increment from arbitrary value (2→3) and with no soft-deleted records (5→6)
- [x] 3.3 Add contract tests for all 6 entity types in `sync-adapter.contract.ts` — added factory functions for WireCategory, WireIdea, WireChecklistItem; test pushes and purges all 6 types; added purge_revision increment with no records test

## Traceability Matrix

| Spec Requirement                            | Test File                                             | Coverage                                                               |
|---------------------------------------------|-------------------------------------------------------|------------------------------------------------------------------------|
| Strict confirmation (`confirm === true`)    | `purge.validation.test.ts` :53-64                     | Full                                                                   |
| Strict confirmation — rejection             | `purge.validation.test.ts` :23-51                     | Full (false, null payload, undefined payload, 1, "true", {}, [], null) |
| Removes soft-deleted records                | `purge.deletion.test.ts` :40-63                       | Full                                                                   |
| Purge across all 6 entity types             | `purge.deletion.test.ts` :65-166                      | Full                                                                   |
| Purge with no soft-deleted records          | `purge.validation.test.ts` :53-64                     | Full (zero counts asserted)                                            |
| Returns counts per entity type              | `purge.deletion.test.ts` :158-165                     | Full                                                                   |
| Increments purge_revision                   | `purge.deletion.test.ts` (new tests)                  | Full (2→3, 5→6)                                                        |
| Increments purge_revision                   | `SyncService.purge.test.ts` :72-76                    | Client-side                                                            |
| Increments purge_revision                   | `sync-adapter.contract.ts`                            | Contract (basic + no records)                                          |
| purge_revision with no records              | `purge.deletion.test.ts` + `sync-adapter.contract.ts` | Full                                                                   |
| Error handling (INTERNAL_ERROR)             | `purge.deletion.test.ts` :135-142                     | Full (sheet error throws)                                              |
| Client detects server purge via pull        | `sync_soft_delete.feature` :13-19                     | Full BDD                                                               |
| Client purge removes local records          | `sync_soft_delete.feature` :30-37                     | Full BDD                                                               |
| Pull does not purge when revision unchanged | `sync_soft_delete.feature` :22-27                     | Full BDD                                                               |
| Contract: soft-delete removal (all types)   | `sync-adapter.contract.ts`                            | Full (all 6 types)                                                     |
| Contract: non-deleted preservation          | `sync-adapter.contract.ts`                            | Full                                                                   |
| Contract: purge_revision increment          | `sync-adapter.contract.ts`                            | Full (basic + no records)                                              |
