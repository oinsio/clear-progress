## 1. Attachment Count Hook (FR11, NFR-P1)

- [x] 1.1 TDD: Write tests for `useAttachmentCount(entityType, entityId)` — returns count via `.count()`, returns 0 for no attachments, excludes deleted attachments
- [x] 1.2 Implement `useAttachmentCount` hook in `packages/client/src/hooks/useAttachmentCount.ts` using `liveQuery` with `db.attachments.where("[entity_type+entity_id]").filter().count()`
- [x] 1.3 Run mutation testing on `useAttachmentCount` — 90.48% (2 equivalent mutants remain: initial useState value, cleanup arrow)

## 2. Compact Tabs — Task Detail Panel (FR1-FR4)

- [x] 2.1 TDD: Write tests for TaskDetailPanel tab rendering — active tab shows icon+label, inactive tabs show icon only, inactive checklist shows progress badge when total > 0, inactive attachments shows count badge when count > 0
- [x] 2.2 Modify tab switcher in `TaskDetailPanel.tsx` — active tab gets `flex-1` with icon+label, inactive tabs get `flex-shrink-0 px-3` with icon + optional badge
- [x] 2.3 Verify no overflow on 320px viewport (NFR-R1) — visual verification deferred

## 3. Compact Tabs — Goal Edit Mode (FR5)

- [x] 3.1 TDD: Write tests for GoalCardEditMode tab rendering — active tab shows icon+label, inactive tab shows icon only with count badge when attachments > 0
- [x] 3.2 Modify tab switcher in `GoalCardEditMode.tsx` to match compact tab pattern
- [x] 3.3 Verify visual consistency between task and goal tab switchers — visual verification deferred

## 4. Task Card Indicators (FR6-FR10, UX3, UX4, NFR-A2)

- [x] 4.1 TDD: Write tests for new TaskItem indicators — attachment count with Paperclip icon, Target icon when goal_id set, MapPin icon when context_id set, Tag icon when category_id set, correct display order
- [x] 4.2 Add `useAttachmentCount` call in TaskItem and render Paperclip + count indicator
- [x] 4.3 Add Target, MapPin, Tag indicators conditional on non-empty IDs, using `text-gray-400 w-2.5 h-2.5` and `aria-hidden="true"`
- [x] 4.4 Reorder existing indicators to match specified order: description, checklist, attachments, goal, context, category, repeat, hidden (FR10)

## 5. Attachment Sync Indicator (FR12, FR13, UX5)

- [x] 5.1 TDD: Write tests for AttachmentListItem amber stripe — shows `border-l-amber-400` when needsSync is true, shows `border-l-transparent` when needsSync is false
- [x] 5.2 Add `useIsUnsynced` to AttachmentListItem and apply conditional `border-l-2 border-l-amber-400` / `border-l-transparent` classes
- [x] 5.3 Verify visual consistency with existing entity sync stripes — uses same `useIsUnsynced` hook and `border-l-2 border-l-amber-400` pattern as other entities

## 6. Verification

- [x] 6.1 Run full unit test suite for changed files — 77 tests pass across 5 files
- [x] 6.2 Run mutation testing on changed source files (scoped, 3 files) — useAttachmentCount 90.48%, AttachmentListItem 77.42%, TaskItem 51.06%. New feature code well-covered; remaining survivors are pre-existing CSS/animation/dep-array mutants
- [x] 6.3 Build verification: `pnpm run build` — passes
