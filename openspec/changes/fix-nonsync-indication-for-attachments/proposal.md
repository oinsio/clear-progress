# Fix Non-Sync Indication for Attachments

## Why

When an attachment has `needsSync=true`, the amber stripe appears only on the attachment list item itself (inside the detail panel). The parent entity (task, idea, goal) in the main list does NOT show the amber stripe, misleading the user into thinking everything is synced. For checklist items this cascade already works (`hasUnsyncedItems` in `TaskItem`), but for attachments it is missing across all three entity types.

## What Changes

- **MODIFIED**: `useAttachmentCount` hook — adds `hasUnsyncedAttachments` boolean to the return value, computed via a lightweight IndexedDB query
- **MODIFIED**: `TaskItem` — includes `hasUnsyncedAttachments` in the `isUnsynced` calculation (alongside existing `hasUnsyncedItems` for checklists)
- **MODIFIED**: `IdeaItem` — adds `useAttachmentCount` hook and includes `hasUnsyncedAttachments` in the `isUnsynced` calculation
- **MODIFIED**: `GoalItem` — adds `useAttachmentCount` hook and includes `hasUnsyncedAttachments` in the `isUnsynced` calculation

## Goals

- G1: Parent entities visually indicate when any of their attachments need syncing
- G2: Consistent amber stripe behavior across all entity types (tasks, ideas, goals) for all nested entities (checklists, attachments)

## Non-Goals

- NG1: Changing sync protocol or attachment sync behavior — this is a display-only fix
- NG2: Adding unsync cascade for other nested entity types beyond checklists and attachments
- NG3: Showing a specific count of unsynced attachments — only a boolean indicator is needed

## Users & Scenarios

- U1: User creates a new attachment on a task while offline. The task card in the list shows an amber stripe, so the user knows there are pending changes.
- U2: User attaches a file to an idea. Before sync completes, the idea in the list shows an amber stripe.
- U3: User attaches a file to a goal. The goal card shows an amber stripe until the attachment syncs.
- U4: After sync completes, all amber stripes disappear from both the parent entity and the attachment item.

## Requirements

### Functional

- FR1: `useAttachmentCount` SHALL return a `hasUnsyncedAttachments` boolean indicating whether any non-deleted attachment for the given entity has `needsSync=true`.
- FR2: `TaskItem` SHALL show the amber left border when `task.needsSync` is true OR `hasUnsyncedItems` (checklist) is true OR `hasUnsyncedAttachments` is true.
- FR3: `IdeaItem` SHALL show the amber left border when `idea.needsSync` is true OR `hasUnsyncedAttachments` is true.
- FR4: `GoalItem` SHALL show the amber left border when `goal.needsSync` is true OR `hasUnsyncedAttachments` is true.

### Non-Functional

#### Performance — NFR-P1

- The `hasUnsyncedAttachments` query SHALL use an IndexedDB `.count()` or equivalent lightweight query, not `.toArray()`. It SHALL add no perceptible latency to list rendering.

#### Accessibility — NFR-A1

- No accessibility changes required — the amber stripe is an existing visual pattern with no new a11y implications.

## UX Acceptance Criteria

- UX1: A task/idea/goal with at least one unsynced attachment SHALL display the amber left border stripe, identical to the stripe shown when the entity itself has `needsSync=true`.
- UX2: When all attachments are synced and the entity itself is synced, the amber stripe SHALL disappear (border becomes transparent or accent if selected).

## Behavior

Behavior specifications will be defined in:
- `features/attachment-unsync-cascade.feature` (@fix-nonsync-indication-for-attachments @FR1 @FR2 @FR3 @FR4)

## Visual Reference

No new visual design. Reuses existing amber stripe pattern (`border-l-amber-400`).

## Affected IA

No changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `attachment-sync-indicator`: Extends the amber stripe pattern to cascade from attachment items to their parent entity cards.
- `task-card-indicators`: `useAttachmentCount` hook gains `hasUnsyncedAttachments` return field.

## Success Metrics

- M1: Amber stripe appears on TaskItem/IdeaItem/GoalItem when any child attachment has `needsSync=true` — verified by unit tests
- M2: Amber stripe disappears after all attachments sync — verified by unit tests
- M3: Mutation testing score >= 95% on modified hook and component logic
- M4: No performance regression in list rendering — `hasUnsyncedAttachments` uses `.count()` query

## Open Questions

None.
