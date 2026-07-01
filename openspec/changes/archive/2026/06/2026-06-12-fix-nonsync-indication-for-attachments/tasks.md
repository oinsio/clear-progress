## 1. Extend useAttachmentCount hook (FR1, NFR-P1)

- [x] 1.1 Write failing tests for `hasUnsyncedAttachments` return field in `useAttachmentCount`: true when unsynced attachments exist, false when all synced, false when no attachments
- [x] 1.2 Implement `hasUnsyncedAttachments` in `useAttachmentCount` using parallel `.count()` query with `needsSync` filter inside the existing liveQuery
- [x] 1.3 Verify tests pass, refactor if needed

## 2. Wire TaskItem to use hasUnsyncedAttachments (FR2)

- [x] 2.1 Write failing test: TaskItem shows amber stripe when `hasUnsyncedAttachments` is true (mock `useAttachmentCount`)
- [x] 2.2 Update TaskItem `isUnsynced` to include `hasUnsyncedAttachments` from `useAttachmentCount`
- [x] 2.3 Verify tests pass, update existing TaskItem test mocks to include `hasUnsyncedAttachments`

## 3. Wire IdeaItem to use hasUnsyncedAttachments (FR3)

- [x] 3.1 Write failing test: IdeaItem shows amber stripe when `hasUnsyncedAttachments` is true
- [x] 3.2 Add `useAttachmentCount` to IdeaItem, include `hasUnsyncedAttachments` in `isUnsynced`
- [x] 3.3 Verify tests pass

## 4. Wire GoalItem to use hasUnsyncedAttachments (FR4)

- [x] 4.1 Write failing test: GoalItem shows amber stripe when `hasUnsyncedAttachments` is true
- [x] 4.2 Add `useAttachmentCount` to GoalItem, include `hasUnsyncedAttachments` in `isUnsynced`
- [x] 4.3 Verify tests pass

## 5. Verification (M3, UX1, UX2)

- [x] 5.1 Run mutation testing on `useAttachmentCount.ts` — target >= 95%
- [x] 5.2 Run `pnpm run build` to verify no build errors
- [x] 5.3 Run full affected test suites: useAttachmentCount, TaskItem, IdeaItem, GoalItem
