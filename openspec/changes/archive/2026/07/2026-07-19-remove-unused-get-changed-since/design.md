## Context

`getChangedSince(since)` is defined identically on all eight client repositories:

```ts
async getChangedSince(since: string): Promise<Entity[]> {
  return db.<table>.where("updated_at").above(since).toArray();
}
```

A full-codebase search (excluding `.stryker-tmp` sandboxes and test/mock files) finds **zero** production call sites. The active sync flow in `SyncService` uses `getNeedingSync()` for locally-dirty records and `applyServerRecords()` for server pulls (the `syncStatus: pending` + LWW model — see FR5 of fix-stale-sync-overwrites). `getChangedSince` is a leftover of a superseded delta-sync design and is flagged as unused by the IDE.

Only `SettingsRepository.getChangedSince` is anchored to a stable spec requirement (`openspec/specs/settings/spec.md` → "Get settings changed since timestamp") and a BDD scenario. The other seven have no spec-level requirement; three have plain unit tests (Task, Checklist) or none. Removing the settings variant therefore requires a spec delta, which is why this cleanup goes through the OpenSpec workflow rather than an ad-hoc edit.

## Goals / Non-Goals

**Goals:**
- Remove `getChangedSince` from all eight repositories and every test/mock that only exercises it (FR1, FR3).
- Remove the corresponding stable-spec requirement so code and spec stay in sync (FR2).

**Non-Goals:**
- Altering the active sync protocol or any other repository method (NG1, NG3).
- Touching backends or the `updated_at` index/field (NG2, NG3).

## Decisions

**D1 — Single change covering all eight repositories.** The method is uniform and dead across every repository; bundling avoids eight micro-changes and keeps the spec delta together with the code removal. Alternative (per-repo changes) rejected as noise with no traceability benefit.

**D2 — Delete tests rather than rewrite them.** The removed tests assert only `getChangedSince` behavior. `SettingsRepository.sync.test.ts` tests nothing else, so the file is deleted; in `TaskRepository.sync.test.ts` and `ChecklistRepository.queries.test.ts` only the `getChangedSince` describe block is removed, leaving the rest of the suite intact. Alternative (keep tests as characterization) rejected — you don't characterize code you're deleting.

**D3 — Remove the mock stubs too.** `createRepositoryMock.ts`, `taskRepositoryMock.ts`, `attachmentRepositoryMock.ts`, and the inline `createMockRepository()` helpers in `settings_service.steps.ts` and `day_boundary_validation.steps.ts` each stub `getChangedSince: vi.fn()`. Since the method leaves the repository types, the stubs must go or they become dangling keys typed against a non-existent method. These mocks are structurally typed against the repository classes, so removing the method from the class makes the stub key unnecessary.

**D4 — Spec delta is REMOVED, not MODIFIED.** The capability disappears entirely; there is no replacement query method, so REMOVED with a Reason/Migration note is the correct delta operation.

## Risks / Trade-offs

- [A future feature might want delta-by-timestamp queries] → Trivially reintroducible one-liner (`db.<table>.where("updated_at").above(since)`); no need to carry dead code until then. Git history preserves the exact form.
- [A hidden dynamic caller (e.g. `repo["getChangedSince"]`) exists] → Mitigation: grep for `getChangedSince` (string form included) across `packages/` before and after; verify build + test suite green (M1, M2).
- [Removing the settings spec requirement desyncs the archived `settings-specs-and-bdd` change] → Acceptable: archived changes are immutable snapshots; the stable spec is the live source of truth and this change updates it correctly via a delta.

## Migration Plan

1. Remove the spec requirement (delta already authored) — validated at archive time.
2. Remove the method from the eight repositories.
3. Remove the dead tests, the BDD scenario + step, and the three mock stubs.
4. Verify: `grep -rn "getChangedSince" packages/client/src` (excluding `.stryker-tmp`) → 0; run client build and the affected unit/BDD suites.

Rollback: revert the change branch; no data or schema migration is involved.
