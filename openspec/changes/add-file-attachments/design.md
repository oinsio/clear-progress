## Context

The app currently has a dedicated cover image subsystem for goals: CoverService, CoverSyncService, LocalCoverCache, CoverRepository, PendingCoverRepository, plus server-side actions (upload, get, delete) on both GAS and Supabase adapters. This system uses content-addressable storage (SHA-256 hash as key), offline-first caching in IndexedDB, a pending upload queue, and ref-counting for deduplication.

We need to generalize this into a generic file storage system and add a new `Attachment` entity that links files to tasks, goals, and ideas. The app is not in production yet, so breaking changes are acceptable (Big Bang migration).

## Goals / Non-Goals

**Goals:**
- Single file infrastructure serving both covers and attachments (FR4)
- Secure file handling with dual validation: MIME allowlist + magic bytes (FR1, FR2)
- Attachment as a first-class synced entity in push/pull protocol (FR5, FR6)
- Offline-first file access (FR14, FR15)

**Non-Goals:**
- Backward compatibility with old API action names
- Streaming uploads (base64 transport stays)
- File compression or optimization

## Decisions

### D1: Big Bang rename (covers -> files)

**Decision**: Rename all cover-specific types, services, and API actions to generic file equivalents in a single coordinated change.

**Rationale**: The app is pre-production with no external consumers. A gradual deprecation would add temporary complexity (two code paths) with no benefit. Driven by FR4.

**Alternatives considered**:
- Gradual migration with deprecated aliases — rejected: unnecessary complexity for a pre-production app.

### D2: Attachment entity structure

**Decision**: Polymorphic `entity_type + entity_id` for linking attachments to tasks/goals/ideas.

```typescript
WireAttachment {
  id: UUID,
  entity_type: "task" | "goal" | "idea",
  entity_id: UUID,
  data_hash: string,       // SHA-256, key into file storage
  filename: string,         // original filename for download
  mime_type: string,
  file_size: number,        // bytes
  sort_order: number,
  is_deleted: boolean,
  created_at: ISOTimestamp,
  updated_at: ISOTimestamp,
  revision: number,
}
```

**Rationale**: Polymorphic link is cleaner than three nullable FK columns (`task_id`, `goal_id`, `idea_id`) — only one is ever populated. Dexie supports compound index `[entity_type+entity_id]` for efficient queries. Driven by FR5.

**Alternatives considered**:
- Separate FK columns per entity type — rejected: 2/3 always empty, doesn't scale to new entity types.

### D3: MIME allowlist + magic bytes as single source of truth in contract

**Decision**: Define `ALLOWED_FILE_MIME_TYPES` and magic byte signatures in `packages/contract/src/constants.ts`. Both client and server import from this package.

```typescript
export const ALLOWED_FILE_MIME_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "text/plain", "application/pdf",
] as const;

export const FILE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png":  [[0x89, 0x50, 0x4E, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "image/gif":  [[0x47, 0x49, 0x46, 0x38]],  // GIF8
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // text/plain has no magic bytes — validated by absence of null bytes
};
```

**Rationale**: Single source prevents drift between client and server validation. Contract package is already shared across all packages. Driven by FR1, FR2.

**Alternatives considered**:
- Separate validation per package — rejected: leads to allowlist drift.

### D4: Dual size limits

**Decision**: `MAX_COVER_SIZE_BYTES = 2 MB` (unchanged), `MAX_ATTACHMENT_SIZE_BYTES = 5 MB`. Both defined in contract.

**Rationale**: Covers are always images displayed small; 2 MB is sufficient. Attachments include PDFs which are commonly larger. 5 MB balances utility with base64 transport overhead (~6.7 MB encoded). Driven by FR3.

### D5: Dynamic reference counting + purge as safety net

**Decision**: Two-layer file cleanup strategy:

1. **`deleteFile` with dynamic ref-counting** — the client calls `deleteFile` when removing a cover or soft-deleting an attachment. The server dynamically counts actual references (from `goals.cover_hash` and `attachments.data_hash`, including soft-deleted records) instead of decrementing a stored `ref_count` counter. File is deleted only when zero references remain. This is idempotent — multiple calls with the same hash from different devices are safe.

2. **Purge as safety net** — after hard-deleting `is_deleted=true` records, the purge endpoint scans for orphaned files (files with zero remaining references) and deletes them. This catches edge cases where `deleteFile` was never called (e.g., cover removed while offline and never explicitly cleaned up).

**Why soft-deleted records count as references**: A soft-deleted attachment can be restored (undo). If the file were deleted at soft-delete time, restore would lose the file. By counting soft-deleted records, `deleteFile` returns `ref_count >= 1` and the file stays. Only after purge hard-deletes the record does the file become eligible for deletion.

**Supabase `deleteFile` implementation**:
```sql
SELECT
  (SELECT COUNT(*) FROM goals WHERE user_id = $1 AND cover_hash = $2)
  +
  (SELECT COUNT(*) FROM attachments WHERE user_id = $1 AND data_hash = $2)
  AS total_refs
```
If `total_refs = 0` → delete file from Storage + `files` table.
If `total_refs > 0` → return `{ deleted: false, ref_count: total_refs }`.

**Supabase purge orphan check** (after hard-deleting records):
```sql
SELECT f.file_id, f.storage_path, f.data_hash
FROM files f
WHERE f.user_id = $1
  AND NOT EXISTS (SELECT 1 FROM goals g WHERE g.user_id = $1 AND g.cover_hash = f.data_hash)
  AND NOT EXISTS (SELECT 1 FROM attachments a WHERE a.user_id = $1 AND a.data_hash = f.data_hash);
```

**GAS implementation**: Same dynamic counting — query Goals sheet for `cover_hash` matches + query Attachments sheet for `data_hash` matches. Sum = ref_count. GAS already used this approach for covers; extend to include attachments.

The `ref_count` column in `files` table becomes unnecessary and is removed.

**Client changes**:
- `useGoalEditForm.ts` — already calls `deleteFile` on cover change/removal (no change).
- `AttachmentService.deleteAttachment` — add `deleteFile` call after soft-delete (new).

**Rationale**: The previous approach (stored `ref_count` counter) had two bugs:
1. **Attachments**: `AttachmentService.deleteAttachment` only set `is_deleted=true` but never called `deleteFile`, so attachment files were never cleaned up.
2. **Multi-device cover deletion**: Two devices deleting the same cover both called `deleteFile`, decrementing the stored `ref_count` twice — potentially deleting a file still referenced by another goal.

Dynamic ref-counting solves bug #2 (idempotent). Adding `deleteFile` call to `AttachmentService` solves bug #1. Purge as safety net handles remaining edge cases.

Driven by FR7, FR17, FR18.

**Alternatives considered**:
- Purge-only cleanup (no client `deleteFile` calls) — simpler but files linger on server until user manually triggers purge. Cover removal without soft-delete (goal stays active, just `cover_hash = ""`) would never clean up the file until purge.
- Server-side trigger in `push_records` RPC — would handle cleanup during push, but adds complexity to an already large RPC function and requires Storage access from within a DB transaction.

### D6: File viewer approach

**Decision**: Extend existing CoverLightbox into a generic FileLightbox that renders content based on MIME type:
- `image/*` — `<img>` tag with blob URL (existing pattern)
- `application/pdf` — `<iframe sandbox="allow-same-origin">` with blob URL
- `text/plain` — `<pre>` block with text content read via `FileReader`

**Rationale**: iframe for PDF is zero-dependency and works well on desktop. If mobile rendering proves inadequate, pdf.js can be added later as a focused follow-up. Driven by FR9, FR10, FR11.

**Alternatives considered**:
- pdf.js/react-pdf — rejected for now: ~500KB bundle size, complex pagination UI. Can be reconsidered if iframe proves insufficient on mobile.

### D7: Download with confirmation

**Decision**: Programmatic download via dynamically created `<a download>` element. Both download and delete actions show a ConfirmDialog before execution.

**Rationale**: Confirmation prevents accidental actions on mobile (fat finger). Programmatic approach allows for button-based UI (not anchor styling). Driven by FR12, FR13.

### D8: IndexedDB migration strategy

**Decision**: Dexie version upgrade with data migration:

```typescript
db.version(N).stores({
  files: "data_hash",
  pending_files: "data_hash",
  attachments: "id, [entity_type+entity_id], data_hash, is_deleted, sort_order, revision, needsSync, updated_at",
}).upgrade(tx => {
  // Move covers -> files
  // Move pending_covers -> pending_files
  // Drop old tables
});
```

**Rationale**: Dexie's built-in migration system handles schema changes cleanly. Data volume is small (personal app, few covers). Driven by FR4.

### D9: Goal edit mode restructuring

**Decision**: Goal edit mode gets two tabs (Details, Attachments) with cover + name always visible at top, and footer buttons (Delete, Cancel, Save) always at bottom.

```
┌─────────────────────────────────────┐
│  [Cover circle]  [Name textarea]    │  ← always visible
├─────────────────────────────────────┤
│  [Details]  [Attachments]           │  ← tab switcher
├─────────────────────────────────────┤
│                                     │
│  Tab content (scrollable)           │
│                                     │
├─────────────────────────────────────┤
│  [Delete]   [Cancel]   [Save]       │  ← always visible
└─────────────────────────────────────┘
```

**Rationale**: Keeps the most important elements (cover, name, actions) accessible regardless of which tab is active. Follows the existing task detail panel pattern. Driven by proposal UX2.

### D10: TaskDetailPanel refactoring prerequisite

**Decision**: TaskDetailPanel.tsx (802 lines) must be split before adding the Attachments tab. Extract into:
- `TaskDetailPanel.tsx` — orchestrator (state, tab switching)
- `TaskDetailsTab.tsx` — details content (description, selectors)
- `TaskChecklistTab.tsx` — checklist content
- `TaskAttachmentsTab.tsx` — new attachments content

**Rationale**: 802 lines exceeds the 300-line hard cap. Adding a third tab without splitting would make the file unmaintainable. Driven by process invariant (file size limit).

### D11: Attachment ordering in chunked push

**Decision**: Attachments go after all entities they can reference in the push chunk fill order: `contexts → categories → goals → ideas → tasks → checklist_items → attachments → settings`.

**Rationale**: Chunked push sends batches of 200 records sequentially. If an attachment lands in an earlier chunk than its parent entity (task, goal, or idea), the server accepts it (no FK existence check), but a network failure between chunks leaves a temporarily orphaned attachment on the server. Placing attachments after tasks/goals/ideas guarantees the parent is always in the same or an earlier chunk. This mirrors the existing `checklist_items` placement (after `tasks`). Driven by FR6.

**Pull side**: No ordering concern — `applyServerRecords` runs in `Promise.all` and IndexedDB stores are independent (no FK constraints).

**Alternatives considered**:
- Server-side FK existence validation for attachments — rejected: adds complexity and would require multi-entity transactional checks that GAS Sheets don't support atomically. The ordering approach is simpler and sufficient.

### D12: Known limitation — purge-before-sync ghost records

**Context**: Driven by FR7, FR17. Discovered during scenario analysis of multi-device file cleanup.

**Scenario**:
1. Both devices synced at revision=5. Attachment `att-1` (`data_hash="abc"`) exists on server at revision=5.
2. **Device A**: soft-deletes `att-1` → push → server updates `att-1` to `is_deleted=true` at revision=6.
3. **Device A**: purge → server hard-deletes `att-1` record, `purge_revision` incremented. File "abc" is orphaned → deleted from Storage.
4. **Device B** (last pull at revision=5): pulls → server returns records with revision > 5, but `att-1` is already hard-deleted — server cannot return it.
5. Device B sees `purge_revision` changed → calls `_purgeLocalDeletedRecords()` → deletes all local records with `is_deleted=true`.
6. **Problem**: On Device B, `att-1` has `is_deleted=false` (Device B never learned about the soft-delete). `_purgeLocalDeletedRecords()` does not touch it. Device B still has `att-1` as active.
7. Device B pushes `att-1` → server re-creates the record. But file "abc" is gone from Storage.
8. **Recovery**: On next full sync, `FileSyncService.reuploadLocalFiles()` detects that file "abc" is referenced but missing on server, and re-uploads it from local IndexedDB cache (if still cached). If not cached, the attachment exists but its file is unavailable until the user re-attaches.

**Decision**: Accept as a known limitation of the sync/purge protocol. This is not specific to files — the same ghost-record problem exists for all entities (a purged task can be "resurrected" by a stale device). The file dimension adds a recoverable data loss risk (file may need re-upload), but the existing `reuploadLocalFiles` mechanism provides automatic recovery in most cases.

**Mitigation**: Document this limitation. A future protocol improvement could add a "tombstone" mechanism where the server returns IDs of recently purged records so that stale devices can clean up. This is out of scope for the current change.

## Risks / Trade-offs

- **[Risk] PDF rendering in iframe on mobile Safari** — may show only first page or prompt download instead of inline rendering.
  Mitigation: Start with iframe (simplest), monitor user experience. If inadequate, replace with pdf.js in a focused follow-up change.

- **[Risk] Base64 transport for 5 MB files** — encoded size ~6.7 MB per file, could be slow on poor connections.
  Mitigation: Acceptable for personal app with low file volume. Streaming upload would require protocol changes across all adapters.

- **[Risk] Big Bang rename breaks all adapters simultaneously** — if any adapter is missed, sync breaks.
  Mitigation: Contract tests run against all adapters. Integration tests verify end-to-end. Pre-production app, no live users affected.

- **[Risk] GAS ref-counting across two sheets is non-atomic** — race condition if two operations happen concurrently.
  Mitigation: GAS already has this limitation for covers. Personal single-user app makes concurrent operations extremely unlikely. Supabase uses atomic SQL.

- **[Trade-off] No file content indexing** — attachments are not searchable by content.
  Acceptable: Filename search is sufficient for the current scope.

- **[Risk] Purge-before-sync ghost records** — a stale device can resurrect a purged attachment, and the file may have been deleted from server storage. See D12.
  Mitigation: `reuploadLocalFiles` on full sync re-uploads missing files from local cache. Documented as known limitation (KL1 in proposal).

## Migration Plan

1. Update `packages/contract` — rename types, add Attachment schema, add MIME/magic constants
2. Update `packages/client` — rename services/repos/hooks, add Attachment entity support, Dexie migration
3. Update `packages/adapter-inmemory` — rename + add attachments to push/pull
4. Update `packages/adapter-gas` — rename actions, update ref-counting, add Attachments sheet
5. Update `packages/adapter-supabase` — rename functions/tables/bucket, update ref-counting, add attachments table
6. Update `packages/integration` — rename existing cover tests, add attachment sync tests

Rollback: not applicable (pre-production, no live data to preserve). Supabase DB and bucket will be recreated via deploy scripts.

## Open Questions

None — all decisions resolved during exploration phase.
