## 1. Extend useAttachmentCount hook (FR1, NFR-P1)

- [ ] 1.1 Write failing tests for `hasUnsyncedAttachments` return field in `useAttachmentCount`: true when unsynced attachments exist, false when all synced, false when no attachments
- [ ] 1.2 Implement `hasUnsyncedAttachments` in `useAttachmentCount` using parallel `.count()` query with `needsSync` filter inside the existing liveQuery
- [ ] 1.3 Verify tests pass, refactor if needed

## 2. Wire TaskItem to use hasUnsyncedAttachments (FR2)

- [ ] 2.1 Write failing test: TaskItem shows amber stripe when `hasUnsyncedAttachments` is true (mock `useAttachmentCount`)
- [ ] 2.2 Update TaskItem `isUnsynced` to include `hasUnsyncedAttachments` from `useAttachmentCount`
- [ ] 2.3 Verify tests pass, update existing TaskItem test mocks to include `hasUnsyncedAttachments`

## 3. Wire IdeaItem to use hasUnsyncedAttachments (FR3)

- [ ] 3.1 Write failing test: IdeaItem shows amber stripe when `hasUnsyncedAttachments` is true
- [ ] 3.2 Add `useAttachmentCount` to IdeaItem, include `hasUnsyncedAttachments` in `isUnsynced`
- [ ] 3.3 Verify tests pass

## 4. Wire GoalItem to use hasUnsyncedAttachments (FR4)

- [ ] 4.1 Write failing test: GoalItem shows amber stripe when `hasUnsyncedAttachments` is true
- [ ] 4.2 Add `useAttachmentCount` to GoalItem, include `hasUnsyncedAttachments` in `isUnsynced`
- [ ] 4.3 Verify tests pass

## 5. Verification (M3, UX1, UX2)

- [ ] 5.1 Run mutation testing on `useAttachmentCount.ts` — target >= 95%
- [ ] 5.2 Run `pnpm run build` to verify no build errors
- [ ] 5.3 Run full affected test suites: useAttachmentCount, TaskItem, IdeaItem, GoalItem
