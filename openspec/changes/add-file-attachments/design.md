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

### D5: Ref-counting expansion

**Decision**: Server ref-counting for file deletion considers both `goals.cover_hash` and `attachments.data_hash`.

**GAS implementation**: Query Goals sheet for `cover_hash` matches + query Attachments sheet for `data_hash` matches. Sum = ref_count.

**Supabase implementation**: SQL query counting references from both `goals` and `attachments` tables where `is_deleted = false`.

**Rationale**: Content-addressable deduplication is already in place. Expanding ref-count sources is the minimal change to support shared files. Driven by FR7.

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
