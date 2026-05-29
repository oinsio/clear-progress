## Context

The UI determines whether to show an amber "unsynced" indicator using timestamp comparison: `updated_at > lastSyncedAt`. The `lastSyncedAt` value is set to `toISOTimestamp()` (current wall-clock time) AFTER the entire sync cycle (push + pull + cover sync) completes in `applySyncResult()`.

This creates a race condition: items created between push batch collection and `lastSyncedAt` update have `updated_at < lastSyncedAt`, so they appear synced even though they were never sent to the server.

The `needsSync` flag already tracks the correct state — it is set to `true` on creation/modification and only cleared to `false` after a successful push result is applied. It is the authoritative source of truth.

Affected code paths (all in `packages/client`):
- `src/hooks/useIsUnsynced.ts` — used by TaskItem, GoalItem, IdeaItem, EntityDetailLayout, GoalDetailPage, CategoriesPage, ContextsPage
- `src/hooks/useChecklist.ts` — `hasUnsyncedItems` computation
- `src/components/tasks/SortableChecklistItem.tsx` — inline amber logic with `lastSyncedAt` prop

## Goals / Non-Goals

**Goals:**
- Replace timestamp comparison with `needsSync` flag in all unsynced indicator logic (FR1, FR2, FR3)
- Remove unnecessary `lastSyncedAt` prop drilling through TaskDetailPanel → ChecklistSection → SortableChecklistItem

**Non-Goals:**
- Changing `lastSyncedAt` lifecycle in SyncProvider (it's still used for other purposes)
- Changing how `needsSync` is set/cleared in services or repositories
- Changing the sync protocol (push/pull logic)

## Decisions

### D1: Use `needsSync` flag directly instead of timestamp comparison

**Rationale**: `needsSync` is already maintained correctly — set to `true` on create/update, cleared to `false` only after successful push result. It is the single source of truth for "has this entity been sent to the server." Timestamp comparison is a derived heuristic that fails under race conditions.

**Alternative considered**: Fix `lastSyncedAt` to be set BEFORE sync starts instead of after. Rejected because this would make the indicator disappear too early for items that are in the push batch but haven't been confirmed by the server yet.

**Alternative considered**: Track a per-entity `lastPushedAt` timestamp. Rejected as over-engineering — `needsSync` already solves this.

### D2: Remove `lastSyncedAt` prop from SortableChecklistItem

**Rationale**: With D1, the component no longer needs an external `lastSyncedAt` value. The `item.needsSync` field is already available on the `ChecklistItem` entity passed as a prop. This eliminates prop drilling through TaskDetailPanel → ChecklistSection → SortableChecklistItem.

## Risks / Trade-offs

- [Risk] Existing tests mock `useIsUnsynced` or SyncProvider's `lastSyncedAt: null` → Tests that mock `useIsUnsynced` directly will continue working. Tests that rely on `lastSyncedAt` for indicator behavior need no changes since they mock the hook, not the internal logic.
- [Risk] `needsSync` reactivity — Dexie `liveQuery` already tracks `needsSync` changes, so UI updates when the flag changes after sync. No reactivity gap.
