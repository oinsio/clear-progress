# Task Detail Page UI Improvements

## Why

On narrow screens, the task detail panel wastes horizontal space: all three tabs (Details, Checklist, Attachments) always show full icon+text labels at equal width. Task cards in lists lack important metadata — users cannot see attachments, goal, context, or category without opening the detail panel. Attachment list items have no visual sync indicator, unlike every other entity in the app.

## What Changes

- **MODIFIED**: Tab switcher in task detail panel and goal edit mode — inactive tabs collapse to icon+badge, active tab keeps icon+text
- **ADDED**: Metadata indicators on task cards — attachment count, goal/context/category icons
- **ADDED**: Lightweight `useAttachmentCount` hook for efficient count-only queries
- **ADDED**: Amber sync stripe on attachment list items

## Capabilities

### New Capabilities

- `compact-tabs`: Responsive tab switcher where active tab shows icon+label (flex), inactive tabs show only icon+count badge
- `task-card-indicators`: Additional metadata indicators on task cards — attachment count, goal, context, category icons in a consistent order
- `attachment-sync-indicator`: Amber left-border sync stripe on attachment list items matching existing entity sync visual pattern

### Modified Capabilities

- `task-detail-panel`: Tab switcher rendering changes from equal-width to compact mode
- `goal-edit-mode`: Tab switcher rendering changes to match compact mode for consistency

## Goals

- G1: Reduce horizontal space used by tab switcher on narrow screens by ~40%
- G2: Show task metadata (attachments, goal, context, category) directly on task cards without opening detail panel
- G3: Provide consistent sync status indication across all UI elements including attachment items

## Non-Goals

- NG1: Changing tab content or behavior — only tab switcher appearance changes
- NG2: Adding text labels for goal/context/category on task cards — icons only
- NG3: Denormalizing attachment count into the Task model — use live query hook instead
- NG4: Creating a generic reusable Tab component — keep inline rendering, just adjust styles

## Users & Scenarios

- U1: Mobile user viewing task detail panel — sees compact tabs that don't overflow
- U2: User scanning task list — sees at a glance which tasks have attachments, goals, contexts, categories
- U3: User who just attached a file — sees amber stripe on the attachment item confirming it needs sync

## Requirements

### Functional

- FR1: Active tab renders with icon + translated label text, gets `flex-1` width
- FR2: Inactive tab renders with icon only (no label text), gets auto width with padding
- FR3: Inactive checklist tab shows progress badge (e.g. "0/9") when total > 0
- FR4: Inactive attachments tab shows count badge (e.g. "2") when count > 0
- FR5: Goal edit mode tabs follow the same compact pattern for consistency
- FR6: Task card shows attachment count indicator (Paperclip icon + count) when attachments exist
- FR7: Task card shows Target icon when task has a goal assigned
- FR8: Task card shows MapPin icon when task has a context assigned
- FR9: Task card shows Tag icon when task has a category assigned
- FR10: Task card indicators follow order: description, checklist, attachments, goal, context, category, repeat, hidden
- FR11: `useAttachmentCount` hook returns count via `db.attachments.where().count()` instead of loading full records
- FR12: Attachment list item shows `border-l-2 border-l-amber-400` when `attachment.needsSync` is true
- FR13: Attachment list item shows `border-l-2 border-l-transparent` when `attachment.needsSync` is false

### Non-Functional

#### Performance

- NFR-P1: `useAttachmentCount` must use IndexedDB `.count()` query, not `.toArray().length`

#### Accessibility

- NFR-A1: Inactive tab badges must have `aria-label` describing the count (e.g. "Checklist 0 of 9")
- NFR-A2: New task card indicators must have appropriate `aria-hidden="true"` as they are decorative supplements

#### Responsive

- NFR-R1: Compact tabs must not overflow or wrap on screens as narrow as 320px
- NFR-R2: Task card indicators must wrap gracefully if line is too long

## UX Acceptance Criteria

- UX1: Tab transition between active/inactive states is smooth (existing `transition-colors` class)
- UX2: Inactive tab badges use same text size and color as active state count
- UX3: Goal/context/category indicators on task card use `text-gray-400` (matching existing indicator style)
- UX4: Attachment count on task card uses same style as checklist count (`text-[0.625rem]`)
- UX5: Amber stripe on attachment items is visually identical to entity amber stripes

## Behavior

- Compact tab rendering: covered by unit tests for TaskDetailPanel and GoalCardEditMode
- Task card indicators: covered by unit tests for TaskItem
- Attachment sync indicator: covered by unit tests for AttachmentListItem

## Affected IA

No IA changes required — all modifications are visual refinements of existing UI elements.

## Success Metrics

- M1: Tab switcher horizontal space reduced by at least 30% on 320px viewport when non-active tabs have no items
- M2: All 4 new task card indicators (attachments, goal, context, category) visible without opening detail panel
- M3: Amber sync stripe appears on 100% of unsynced attachment items

## Open Questions

None — all decisions resolved during exploration.
