# Design: Extend Pin Functionality to Entity Detail Pages

## Context

Pin functionality for TaskDetailPanel is already implemented in change `pin-task-detail-panel`:
- `useDetailPanelPinned` hook exists and works via `LocalPreferencesService`
- Storage key `DETAIL_PANEL_PINNED` added to constants
- i18n keys for pin/unpin exist
- Pin button in `TaskDetailPanel` implemented with `useIsDesktop()` condition
- `TaskPageLayout` integrated with `useDetailPanelPinned` and implements pinning logic

Problem: `EntityDetailLayout` (used in CategoryDetailPage, ContextDetailPage) and `GoalDetailPage` have their own split-pane logic implementation that doesn't use `useDetailPanelPinned`.

Current state:
- `EntityDetailLayout.tsx` — computes `showDetailColumn = isDesktop && selectedTask`, unaware of pinned state
- `GoalDetailPage.tsx` — computes detail panel render condition via `selectedTask`, unaware of pinned state
- `TaskDetailPanel.tsx` — pin button already implemented, but not verified in entity pages context

## Goals / Non-Goals

**Goals:**
- Add `useDetailPanelPinned` support to `EntityDetailLayout` without breaking changes
- Add `useDetailPanelPinned` support to `GoalDetailPage` without breaking changes
- Reuse existing logic from `TaskPageLayout` (`showDetailColumn` computation, empty state placeholder)
- Ensure pin button in `TaskDetailPanel` works on entity pages

**Non-Goals:**
- Refactoring layout components architecture (merging `EntityDetailLayout` and `TaskPageLayout`)
- Changing pin button or empty state design
- Creating separate pinning settings for different page types

## Decisions

### Decision 1: Reuse existing hook without modifications

**Chosen approach:** Use `useDetailPanelPinned()` as-is in both `EntityDetailLayout` and `GoalDetailPage`.

**Rationale:** Hook is already implemented, tested (mutation score 100%), and works via global localStorage setting. No reason to create separate hooks or modify the existing one.

**Alternatives considered:**
- ❌ Create `useEntityDetailPanelPinned()` for separate settings — contradicts G2 (zero surprises)
- ❌ Pass `isDetailPanelPinned` via props — increases coupling, complicates usage

### Decision 2: Extract showDetailColumn computation pattern

**Chosen approach:** Use identical pattern from `TaskPageLayout`:
```typescript
const { isDetailPanelPinned } = useDetailPanelPinned();
const showDetailColumn = isDesktop && (isDetailPanelPinned || selectedTask);
```

**Rationale:** Pattern is already implemented and tested in `TaskPageLayout`. Consistency is more important than abstraction.

**Alternatives considered:**
- ❌ Create hook `useShowDetailColumn(selectedTask)` — premature abstraction, pattern used in only 3 places
- ❌ Use different logic for entity pages — breaks UX consistency

### Decision 3: Reuse empty state placeholder from TaskPageLayout

**Chosen approach:** Copy empty state JSX block from `TaskPageLayout` to `EntityDetailLayout` and `GoalDetailPage`:
```tsx
{showDetailColumn && !selectedTask && (
  <div className="flex items-center justify-center h-full bg-gray-50">
    <p className="text-gray-400 text-sm">
      {t("taskDetail.emptyState")}
    </p>
  </div>
)}
```

**Rationale:** Empty state is 6 lines of JSX. Extracting to a separate component is excessive for such a simple block.

**Alternatives considered:**
- ❌ Create `TaskDetailEmptyState` component — overkill for a static placeholder
- ❌ Use different text for entity pages — user doesn't care where they see the empty state

### Decision 4: No changes to TaskDetailPanel

**Chosen approach:** Verify pin button works in entity pages context without modifications.

**Rationale:** Pin button renders conditionally (`useIsDesktop()`), uses `useDetailPanelPinned()` directly. Component doesn't depend on page context.

**Testing plan:**
- Manually verify pin button appears in `EntityDetailLayout` context (CategoryDetailPage)
- Manually verify pin button appears in `GoalDetailPage` context
- Existing BDD tests for pin button remain valid

## Risks / Trade-offs

### [Risk] Code duplication across EntityDetailLayout, GoalDetailPage, TaskPageLayout
**Mitigation:** Acceptable duplication for maintainability. Layout unification is a separate large task (NG1 in proposal). Current approach minimizes blast radius of changes.

### [Risk] Pin button may not render due to entity pages specifics
**Mitigation:** Manual verification after implementation. Pin button uses only `useIsDesktop()` and `useDetailPanelPinned()`, both hooks are context-independent.

### [Risk] Empty state may not match i18n for entity pages
**Mitigation:** i18n key `taskDetail.emptyState` already exists and is universal ("Select a task to view details"). Suitable for all contexts.

## Implementation Notes

### EntityDetailLayout changes
1. Add `const { isDetailPanelPinned } = useDetailPanelPinned();`
2. Replace `isDesktop && selectedTask` with `isDesktop && (isDetailPanelPinned || selectedTask)`
3. Add empty state placeholder block with condition `showDetailColumn && !selectedTask`
4. Ensure resize handle renders when `showDetailColumn` (not just `selectedTask`)

### GoalDetailPage changes
1. Add `const { isDetailPanelPinned } = useDetailPanelPinned();`
2. Replace conditional `selectedTask` with `isDesktop && (isDetailPanelPinned || selectedTask)` for detail column render
3. Add empty state placeholder block with condition `showDetailColumn && !selectedTask`
4. Ensure resize handle renders when `showDetailColumn` (not just `selectedTask`)

### TaskDetailPanel verification
- No code changes needed
- Manual testing: open CategoryDetailPage → select task → verify pin button visible and functional
- Manual testing: open GoalDetailPage → select task → verify pin button visible and functional

## Migration Plan

No migration needed — feature is additive. Users who never used pin functionality see no changes. Users who enabled pinning will see consistent behavior across all pages.

## Open Questions

None — all technical decisions made, infrastructure exists.
