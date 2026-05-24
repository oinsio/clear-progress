## 1. Create purge spec and sync delta

- [ ] 1.1 Create `openspec/specs/purge/spec.md` with requirements: strict confirmation, soft-deleted removal, PurgeResponse structure, purge_revision increment, error handling (FR1-FR5)
- [ ] 1.2 Update `openspec/specs/sync-protocol/spec.md` — add cross-reference to purge spec in the "Purge hard-deletes soft-deleted records" requirement
- [ ] 1.3 Archive change via `/opsx:archive`

## 2. Test verification

- [ ] 2.1 Verify `purge.validation.test.ts` covers all scenarios from purge spec (strict confirm, truthy non-boolean, null, undefined) (FR6)
- [ ] 2.2 Verify `purge.deletion.test.ts` covers deletion across all 6 entity types, "no soft-deleted records" scenario, purge_revision increment (FR6)
- [ ] 2.3 Verify `sync_soft_delete.feature` + steps cover client-side purge coordination (FR7)
- [ ] 2.4 Verify `sync-adapter.contract.ts` covers contract tests for purge (FR8)
- [ ] 2.5 Run `npx vitest run` in adapter-gas and client — all tests green (M2)
- [ ] 2.6 Build traceability matrix: requirement -> test (M3)
