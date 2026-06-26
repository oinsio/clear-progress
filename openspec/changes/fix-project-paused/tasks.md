## 1. Contract: ProjectPausedError

- [x] 1.1 Create `ProjectPausedError` class in `packages/contract/src/errors/` — FR1
- [x] 1.2 Export from `index.ts` — FR1

## 2. Adapter: HTTP 540 detection

- [x] 2.1 Write unit test for 540 detection in `invoke()` (TDD red phase) — FR1
- [x] 2.2 In `SupabaseSyncAdapter.invoke()` add check for `error.context.status === 540` → throw `ProjectPausedError` — FR1
- [x] 2.3 Run unit tests (TDD green phase) — FR1

## 3. Client: SyncStatus and SyncProvider

- [x] 3.1 Add `"project_paused"` to `SyncStatus` type (`types/common.ts`) — FR2
- [x] 3.2 Write unit tests for `handleSyncError` with `ProjectPausedError` (TDD red phase) — FR3
- [x] 3.3 In `SyncProvider.handleSyncError()` add branch: if `ProjectPausedError` → `setSyncStatus("project_paused")`, do NOT start ping interval — FR3
- [x] 3.4 Ensure periodic sync continues running when `"project_paused"` — FR4
- [x] 3.5 Run unit tests (TDD green phase) — FR3, FR4

## 4. Client: UI

- [x] 4.1 Create `ProjectPausedDialog` based on `ConfirmDialog` — FR5
- [x] 4.2 Add "Project paused" status display in `SidebarSyncBlock` — FR5
- [x] 4.3 Add i18n keys to `ru.json` and `en.json` — FR5
- [x] 4.4 Ensure a11y: role="dialog", aria-labelledby, aria-describedby — NFR-A1

## 5. Verification

- [x] 5.1 `pnpm run build` — project builds without errors
- [ ] 5.2 Mutation testing on changed files — target >=95%
- [x] 5.3 Existing unit tests pass without regressions
