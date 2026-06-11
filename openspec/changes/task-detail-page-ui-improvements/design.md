## Context

The task detail panel and goal edit mode use inline tab switchers with equal-width buttons. On narrow screens (320px), three equal-width tabs overflow or compress text awkwardly. Task cards in lists show only description, checklist, repeat, and hidden indicators — missing attachments, goal, context, and category. Attachment list items lack the amber sync stripe that every other entity displays.

All three changes are purely UI — no data model changes, no new API calls, no backend impact.

## Goals / Non-Goals

**Goals:**
- Compact tab rendering: active tab expands, inactive tabs shrink (FR1-FR5)
- Task card indicators: show attachment count and entity assignment icons (FR6-FR10)
- Lightweight attachment count hook: efficient IndexedDB count query (FR11, NFR-P1)
- Amber sync stripe on attachment items: consistent visual pattern (FR12-FR13)

**Non-Goals:**
- No shared Tab component extraction — keep inline rendering per NG4
- No Task model denormalization — use live query hook per NG3
- No tab content or behavior changes per NG1

## Decisions

### D1: Tab width strategy — active `flex-1`, inactive auto-width

Active tab gets `flex-1` to fill available space and shows icon + label. Inactive tabs remove `flex-1`, use `flex-shrink-0 px-3` for auto-width, and show only icon + optional badge.

**Why not min-width on all tabs?** Equal-width tabs waste space when labels differ in length. The active/inactive split maximizes space for the tab the user is currently viewing.

**Why not a shared Tab component?** Only two consumers (TaskDetailPanel, GoalCardEditMode) with slightly different tab sets. Extracting a component adds indirection without enough reuse to justify it (NG4).

### D2: useAttachmentCount hook — Dexie `.count()` query

Create `useAttachmentCount(entityType, entityId)` that calls `db.attachments.where({entity_type, entity_id, is_deleted: false}).count()` via `useLiveQuery`. Returns `number`.

**Why not reuse useAttachments?** `useAttachments` calls `.toArray()` loading all attachment records. For task cards we only need a count — `.count()` is O(1) on indexed fields vs O(n) for `.toArray()`.

**Why not denormalize into Task?** Adding `attachment_count` to Task requires a DB migration, sync protocol changes, and keeping the count in sync on every attachment CRUD. A live query is simpler and always consistent (NG3).

### D3: Indicator order on task cards — matches QuickActions panel

Order: description, checklist+count, attachments+count, goal, context, category, repeat, hidden. This matches the button order in TaskQuickActions (minus box and edit, which are actions not indicators).

**Why this order?** Content indicators (description, checklist, attachments) first — they describe what's inside. Assignment indicators (goal, context, category) second — they describe where it belongs. State indicators (repeat, hidden) last — they describe behavior.

### D4: Indicator color — gray-400 for all, matching existing pattern

All new indicators (attachments, goal, context, category) use `text-gray-400` matching existing description/checklist/repeat/hidden indicators in TaskItem. QuickActions uses accent color for active assignments, but card indicators are read-only status, not interactive buttons.

### D5: Amber stripe on AttachmentListItem — border-l-2 pattern

Add `border-l-2` with conditional `border-l-amber-400` / `border-l-transparent` based on `attachment.needsSync`. Same pattern as TaskItem, GoalItem, IdeaItem.

**Why pass needsSync directly?** AttachmentListItem already receives the full `Attachment` object which includes `needsSync`. No new prop needed — just read `attachment.needsSync` inside the component. However, `useIsUnsynced` hook exists for this pattern and should be reused for consistency.

## Risks / Trade-offs

- [Risk] `useAttachmentCount` per task card adds N live queries to task lists → Mitigation: `.count()` is an indexed O(1) operation in IndexedDB, and Dexie deduplicates identical live queries. Lists are virtualized for large datasets.
- [Risk] Compact tabs may look too sparse when all tabs have zero items → Mitigation: Three small icons still scan well; the active tab always provides text context for orientation.
- [Trade-off] Not extracting a shared Tab component means duplicated tab styling in two files → Accepted: two consumers is below the threshold for abstraction per project rules.
