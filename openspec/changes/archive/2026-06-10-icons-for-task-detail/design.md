## Context

Entity detail panels (Task, Goal, Idea) have fields and tabs without visual icons, making them text-heavy. Icons for
the same entities are already used in TaskItem.tsx, TaskQuickActions.tsx, and entity pages (GoalsPage, ContextsPage,
CategoriesPage). All icons come from lucide-react.

Affected files:
- `packages/client/src/components/tasks/DrillDownRow.tsx` — generic row component
- `packages/client/src/components/tasks/TaskDetailsTab.tsx` — details tab with fields
- `packages/client/src/components/tasks/TaskDetailPanel.tsx` — panel with tab switcher
- `packages/client/src/components/goals/GoalCardEditMode.tsx` — goal edit card with tab switcher
- `packages/client/src/components/goals/GoalEditDetailsTab.tsx` — goal details tab with description and status
- `packages/client/src/components/ideas/IdeaDetailPanel.tsx` — idea detail panel with description

## Goals / Non-Goals

**Goals:**
- Add decorative icons to fields, tabs, and buttons across entity detail panels (FR1-FR16)
- Reuse icon conventions already established in the codebase (G2)
- Maintain visual consistency across Task, Goal, and Idea detail views (G3)

**Non-Goals:**
- No new icon library or custom SVG components (NG1)
- No layout/spacing redesign (NG2)
- No icons on Name fields (NG3)

## Decisions

### D1: Optional icon prop on DrillDownRow

Add `icon?: LucideIcon` prop to DrillDownRow. When provided, render it before the label with `w-4 h-4 text-gray-500 aria-hidden="true"`. Optional to avoid breaking existing usage patterns if DrillDownRow is reused elsewhere.

**Alternative**: Create a separate `IconDrillDownRow` component — rejected, adds unnecessary duplication for a single optional prop.

### D2: Icon constant map for task detail fields

Define a `TASK_DETAIL_ICONS` constant map in `taskEditShared.ts` mapping field names to lucide icons. This avoids scattered icon imports across components and keeps the icon-to-field mapping in one place.

```ts
export const TASK_DETAIL_ICONS = {
  description: FileText,
  goal: Target,
  context: MapPin,
  category: Tag,
  repeat: Repeat,
  hide: EyeOff,
  duplicate: Copy,
} as const;
```

**Alternative**: Import icons directly in each component — rejected, harder to maintain consistency.

### D3: Tab icons defined inline in TaskDetailPanel

Tab icons (AlignLeft, ListChecks, Paperclip) are used only in the tab switcher in TaskDetailPanel.tsx. Define them as a `TAB_ICONS` map in `taskEditShared.ts` alongside existing `ACTIVE_TAB` constant.

### D4: Icon sizing convention

- DrillDownRow fields and tab buttons: `w-4 h-4` (matches existing icon sizes in TaskItem indicators)
- Duplicate button: `w-4 h-4` (inline with button text)

## Risks / Trade-offs

- [Risk] Adding icons may make tab buttons narrower on small screens → Mitigation: NFR-R1 requires testing at 320px viewport; icons are small (16px) and should fit
- [Risk] Two new icons (AlignLeft, Copy) not yet in the bundle → Mitigation: lucide-react is already a dependency and tree-shakes; two additional icons add negligible bundle size
