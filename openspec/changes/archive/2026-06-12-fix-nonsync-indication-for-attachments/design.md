## Context

The amber left-border stripe is the established pattern for indicating unsynced entities. For checklist items, `TaskItem` already cascades: if any checklist item has `needsSync=true`, the task card shows the amber stripe via `hasUnsyncedItems` from `useChecklist`. However, attachments lack this cascade — the amber stripe only appears on the `AttachmentListItem` inside the detail panel, not on the parent entity card in the list.

Attachments can belong to tasks, goals, and ideas (FR8 of add-file-attachments). The `useAttachmentCount` hook already subscribes to a liveQuery on the attachments table filtered by `entity_type` + `entity_id`, but only returns a count.

## Goals / Non-Goals

**Goals:**
- Extend `useAttachmentCount` to also return `hasUnsyncedAttachments` (FR1)
- Wire `hasUnsyncedAttachments` into the `isUnsynced` logic of TaskItem (FR2), IdeaItem (FR3), GoalItem (FR4)
- Keep the query lightweight (NFR-P1)

**Non-Goals:**
- Changing sync behavior or protocol
- Adding new UI elements — only reusing the existing amber stripe

## Decisions

### D1: Extend `useAttachmentCount` vs. create a new hook

**Decision**: Extend `useAttachmentCount` to return `hasUnsyncedAttachments`.

**Rationale**: The hook already has a liveQuery subscription on the same table with the same filter (`entity_type + entity_id`, non-deleted). Adding a second count query for `needsSync=true` is cheaper than creating a separate hook with its own subscription. This mirrors how `useChecklist` returns both `items`/`progress` and `hasUnsyncedItems`.

**Alternative considered**: A separate `useHasUnsyncedAttachments` hook. Rejected because it would create a redundant liveQuery subscription on the same data.

### D2: Query strategy for `hasUnsyncedAttachments`

**Decision**: Use a parallel `.count()` query with an additional `.filter(a => a.needsSync)` predicate inside the same liveQuery callback.

**Rationale**: `.count()` with filter is lightweight — Dexie doesn't load full records. Running two `.count()` queries in parallel (one for total, one for unsynced) inside a single liveQuery subscription means only one subscription per entity, with reactive updates when any attachment changes.

```typescript
const subscription = liveQuery(async () => {
  const baseQuery = db.attachments
    .where("[entity_type+entity_id]")
    .equals([entityType, entityId])
    .filter((attachment) => !attachment.is_deleted);

  const [count, unsyncedCount] = await Promise.all([
    baseQuery.count(),
    baseQuery.filter((attachment) => attachment.needsSync).count(),
  ]);
  return { count, unsyncedCount };
}).subscribe(/* ... */);
```

**Note**: Dexie's `.filter()` returns a new Collection each time, so chaining `.filter()` on the base query is safe — it doesn't mutate the original.

### D3: Wiring into IdeaItem and GoalItem

**Decision**: Add `useAttachmentCount` to IdeaItem and GoalItem, using the same pattern as TaskItem.

**Rationale**: Both entities support attachments (FR8 of add-file-attachments). The entity type constants ("idea", "goal") are already defined in the contract package. The `attachmentCount` value itself won't be displayed (unlike TaskItem which shows a badge) — only `hasUnsyncedAttachments` is needed for the amber stripe. However, returning `attachmentCount` too costs nothing and may be useful in the future.

## Risks / Trade-offs

- **[Risk] Additional liveQuery subscriptions in IdeaItem and GoalItem** → Mitigated by using `.count()` (lightweight) and the fact that attachment counts are already queried this way in TaskItem without performance issues. The subscription reacts only when the attachments table changes for that entity.
- **[Risk] Dexie `.filter().count()` chain correctness** → Verified: Dexie Collection's `.filter()` returns a new Collection, and `.count()` works on filtered collections. This is a documented Dexie pattern.
