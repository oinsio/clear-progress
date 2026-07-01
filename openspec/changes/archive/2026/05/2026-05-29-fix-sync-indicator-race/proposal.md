# Fix Sync Indicator Race Condition

## Why

The amber "unsynced" indicator on tasks and checklist items uses timestamp comparison (`updated_at > lastSyncedAt`) instead of the authoritative `needsSync` flag. Since `lastSyncedAt` is set to the current wall-clock time AFTER the entire sync cycle completes, items created DURING a sync cycle lose their amber indicator even though they were never sent to the server. This gives the user a false sense that everything is synchronized.

## What Changes

- **MODIFIED**: `useIsUnsynced` hook — switch from timestamp comparison to `needsSync` flag
- **MODIFIED**: `SortableChecklistItem` component — remove inline timestamp logic, use `needsSync`
- **MODIFIED**: `useChecklist` hook — `hasUnsyncedItems` uses `needsSync` instead of timestamps
- **MODIFIED**: `TaskDetailPanel` — remove `lastSyncedAt` prop drilling
- **ADDED**: Unit BDD test proving the race condition and verifying the fix
- **ADDED**: Integration test (Playwright) reproducing the race condition E2E

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `sync-protocol`: The unsynced indicator requirement changes from timestamp-based to `needsSync`-based detection

## Goals

- G1: Amber indicator accurately reflects whether an entity has been sent to the server
- G2: No false "synced" state for items created during an active sync cycle

## Non-Goals

- NG1: Changing the sync protocol itself (push/pull logic, conflict resolution)
- NG2: Changing how `needsSync` flag is set or cleared
- NG3: Changing `lastSyncedAt` lifecycle in SyncProvider

## Users & Scenarios

- U1: User editing a task's checklist while sync runs in the background — expects to see amber on items not yet sent

## Requirements

### Functional

- FR1: `useIsUnsynced` SHALL return `entity.needsSync` instead of comparing `updated_at > lastSyncedAt`
- FR2: `SortableChecklistItem` amber indicator SHALL use `item.needsSync` to determine visibility
- FR3: `useChecklist.hasUnsyncedItems` SHALL use `item.needsSync` to determine if any checklist items need sync
- FR4: Items created after push() collects its batch SHALL retain amber indicator until the next successful sync includes them

### Non-Functional

#### Performance

- NFR-P1: No additional database queries — `needsSync` is already available on every client entity

## UX Acceptance Criteria

- UX1: Amber bar on `SortableChecklistItem` visible for every item with `needsSync: true`
- UX2: Amber bar disappears only after the item has been successfully pushed and `needsSync` set to `false`
- UX3: No visual change for items that are already synced (`needsSync: false`)

## Behavior

- `sync_protocol/sync_indicator_race.feature` (@fix-sync-indicator-race tags)

## Visual Reference

No visual changes — same amber-400 indicator, same placement. Only the condition for showing it changes.

## Affected IA

No changes.

## Success Metrics

- M1: Unit BDD test passes — items created during sync retain `needsSync: true` indicator
- M2: Integration test passes — amber visible on unsynced checklist items after sync completes
- M3: All existing sync-related tests continue to pass

## Open Questions

_None_
