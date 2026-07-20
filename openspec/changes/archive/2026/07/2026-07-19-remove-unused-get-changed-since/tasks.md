## 1. Spec removal

- [x] 1.1 Remove the "Get settings changed since timestamp" requirement and its "Filter settings by updated_at" scenario from `openspec/specs/settings/spec.md` (FR2)

## 2. Remove method from repositories

- [x] 2.1 Remove `getChangedSince` from `packages/client/src/db/repositories/ContextRepository.ts` (FR1)
- [x] 2.2 Remove `getChangedSince` from `packages/client/src/db/repositories/CategoryRepository.ts` (FR1)
- [x] 2.3 Remove `getChangedSince` from `packages/client/src/db/repositories/AttachmentRepository.ts` (FR1)
- [x] 2.4 Remove `getChangedSince` from `packages/client/src/db/repositories/TaskRepository.ts` (FR1)
- [x] 2.5 Remove `getChangedSince` from `packages/client/src/db/repositories/IdeaRepository.ts` (FR1)
- [x] 2.6 Remove `getChangedSince` from `packages/client/src/db/repositories/GoalRepository.ts` (FR1)
- [x] 2.7 Remove `getChangedSince` from `packages/client/src/db/repositories/SettingsRepository.ts` (FR1)
- [x] 2.8 Remove `getChangedSince` from `packages/client/src/db/repositories/ChecklistRepository.ts` (FR1)

## 3. Remove dead tests and BDD scenario

- [x] 3.1 Remove the `getChangedSince` describe block from `TaskRepository.sync.test.ts` (FR1, FR3)
- [x] 3.2 Delete `SettingsRepository.sync.test.ts` (whole file tests only `getChangedSince`) (FR1, FR3)
- [x] 3.3 Remove the `getChangedSince` describe block from `ChecklistRepository.queries.test.ts` (FR1, FR3)
- [x] 3.4 Remove the "Filter settings by updated_at" scenario from `settings_repository_sync_flags.feature` and its step from `settings_repository_sync_flags.steps.ts` (FR1, FR2)

## 4. Remove mock stubs

- [x] 4.1 Remove the `getChangedSince` stub from `test/mocks/createRepositoryMock.ts` (FR1)
- [x] 4.2 Remove the `getChangedSince` stub from `test/mocks/taskRepositoryMock.ts` (FR1)
- [x] 4.3 Remove the `getChangedSince` stub from `test/mocks/attachmentRepositoryMock.ts` (FR1)
- [x] 4.4 Remove the `getChangedSince` stub from `test/features/settings/steps/settings_service.steps.ts` (FR1)
- [x] 4.5 Remove the `getChangedSince` stub from `test/features/day_boundary/steps/day_boundary_validation.steps.ts` (FR1)

## 5. Verification

- [x] 5.1 `grep -rn "getChangedSince" packages/client/src` (excluding `.stryker-tmp`) returns 0 matches (M1, NFR-P1)
- [x] 5.2 Run the affected unit + BDD suites (repository tests + settings BDD) — all green (M2, FR3)
- [x] 5.3 `pnpm run build` in `packages/client` passes (M2)
