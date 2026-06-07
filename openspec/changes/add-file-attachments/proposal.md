# Add File Attachments

## Why

Users need to attach supporting files (images, PDFs, text documents) to tasks, goals, and ideas. Currently only goal cover images are supported as binary files. Extending the file infrastructure to general-purpose attachments unlocks richer context for items — reference materials, screenshots, notes, receipts. The existing cover system (content-addressable storage, offline-first, pending queue) provides a proven foundation to generalize.

## What Changes

- **BREAKING**: Rename cover file operations to generic file operations across the entire stack (contract, client, all adapters)
  - `uploadCover` -> `uploadFile`, `getCover` -> `getFile`, `deleteCover` -> `deleteFile`, `uploadCovers` -> `uploadFiles`
  - IndexedDB tables: `covers` -> `files`, `pending_covers` -> `pending_files`
  - Services: `CoverService` -> `FileService`, `CoverSyncService` -> `FileSyncService`, `LocalCoverCache` -> `LocalFileCache`
  - Full sync UI steps: `reupload_covers` -> `reupload_files`, `upload_covers` -> `upload_files`, `download_covers` -> `download_files`
  - Server storage: GAS Drive folder `Covers` -> `Files`, Supabase bucket `covers` -> `files`, table `covers` -> `files`
- **ADDED**: `Attachment` as a new synced entity (pull/push protocol)
- **ADDED**: File attachment UI for tasks, goals, and ideas
- **ADDED**: File viewer (lightbox) for images, PDF, and plain text
- **ADDED**: File download with confirmation dialog
- **ADDED**: Unified MIME allowlist and magic bytes validation (client + server)
- **MODIFIED**: `deleteFile` endpoint uses dynamic reference counting (counts actual DB references) instead of stored `ref_count` column — idempotent and safe for multi-device use
- **MODIFIED**: Purge cleans up orphaned files as a safety net after hard-deleting records
- **MODIFIED**: Goal edit mode restructured with Details/Attachments tabs
- **MODIFIED**: Task detail panel gets a third tab (Attachments)
- **MODIFIED**: Idea detail panel gets attachments section

## Goals

- G1: Users can attach files to any entity (task, goal, idea) and access them offline
- G2: File operations are secure — validated MIME types, magic bytes, size limits, sandboxed rendering
- G3: Single file infrastructure for covers and attachments — no duplication
- G4: Attachment sync works reliably across devices via the existing push/pull protocol

## Non-Goals

- NG1: File type support beyond images, PDF, plain text, and markdown (future expansion)
- NG2: In-app file editing (e.g., annotating PDFs, cropping images)
- NG3: Shared/collaborative file access between users
- NG4: File versioning (replacing a file creates a new attachment)
- NG5: Total storage limit per entity
- NG6: HTML file support (security risk, out of scope)

## Users & Scenarios

- U1: User attaches a PDF receipt to a "Pay taxes" task for reference
- U2: User attaches a screenshot to an idea to capture visual inspiration
- U3: User attaches multiple reference images to a goal
- U4: User views an attached PDF while offline (cached in IndexedDB)
- U5: User downloads an attached file to their device
- U6: User deletes an attachment they no longer need
- U7: User creates an attachment on phone, views it on desktop after sync

## Requirements

### Functional

- FR1: System SHALL support a unified MIME type allowlist defined in `packages/contract`: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `text/plain`, `text/markdown`, `application/pdf`. This allowlist SHALL be the single source of truth for client and server validation.
- FR2: System SHALL validate files using magic bytes (file signature) on both client and server, not only MIME type from the file object.
- FR3: File size limit SHALL be 5 MB for attachments and 2 MB for covers. Limits SHALL be defined in `packages/contract`.
- FR4: System SHALL rename all cover-specific file operations to generic file operations across contract, client, and all adapters (Big Bang migration).
- FR5: System SHALL introduce `Attachment` as a synced entity with fields: `id`, `entity_type` (task/goal/idea), `entity_id`, `data_hash`, `filename`, `mime_type`, `file_size`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`.
- FR6: Attachments SHALL participate in the push/pull sync protocol (new fields in `PullResponse.attachments` and `PushRequest.attachments`).
- FR7: The `deleteFile` server endpoint SHALL dynamically count actual references from `goals.cover_hash` and `attachments.data_hash` (including soft-deleted records) instead of maintaining a stored `ref_count` counter. File is deleted only when zero references remain. This ensures idempotent behavior across multi-device scenarios.
- FR17: The purge operation SHALL clean up orphaned files as a safety net. After hard-deleting `is_deleted=true` records, the server SHALL find files with zero remaining references and delete them from storage.
- FR18: Client SHALL call `deleteFile` when removing a cover (existing behavior) and when soft-deleting an attachment (new). Soft-deleted records still count as references, so `deleteFile` will not remove the file until purge hard-deletes the record and a subsequent `deleteFile` or purge finds zero references.
- FR8: Users SHALL be able to attach files to tasks, goals, and ideas.
- FR9: Users SHALL be able to view attached images inline in a lightbox modal.
- FR10: Users SHALL be able to view attached PDFs rendered via react-pdf (canvas-based, pdf.js) within a lightbox modal. No browser PDF plugin or iframe is used — PDF content is rendered securely on canvas without script execution.
- FR11: Users SHALL be able to view attached plain text and markdown files in a `<pre>` block within a lightbox modal.
- FR12: Users SHALL be able to download attached files. Download action SHALL require confirmation dialog.
- FR13: Users SHALL be able to delete attachments. Delete action SHALL require confirmation dialog.
- FR14: Attachments SHALL be available offline from IndexedDB cache.
- FR15: Files that fail to upload (offline) SHALL be queued in `pending_files` and uploaded on next sync.
- FR16: Attachment soft-delete SHALL follow existing patterns (`is_deleted = true`, `needsSync = true`).

### Non-Functional

#### Performance — NFR-P1
- File validation (MIME + magic bytes) SHALL complete in under 100ms for files up to 5 MB.

#### Accessibility — NFR-A1
- File lightbox SHALL trap focus and support Escape to close.
- Attachment list items SHALL be keyboard-navigable.
- File input SHALL have accessible label.
- Confirmation dialogs SHALL trap focus and support Escape to cancel.

#### Responsive — NFR-R1
- Attachment list and lightbox SHALL work on mobile viewports (320px+).
- PDF iframe SHALL be scrollable on mobile.

## UX Acceptance Criteria

- UX1: Task detail panel SHALL have three tab buttons: Details, Checklist, Attachments.
- UX2: Goal edit mode SHALL show cover + name at top (always visible), then two tab buttons: Details, Attachments. Footer buttons (Delete, Cancel, Save) SHALL remain at the bottom regardless of active tab.
- UX3: Goal view mode SHALL use a single chevron to collapse/expand the description and attachments together. When collapsed, description is truncated to 2 lines and attachments are hidden. When expanded, full description and attachment list are both visible. The chevron SHALL appear when the description overflows OR when the goal has attachments.
- UX4: Idea detail panel SHALL show attachments section below the description field.
- UX5: Attachment list items SHALL show: file type icon, filename, file size, download button, delete button.
- UX6: Clicking an attachment item SHALL open the file lightbox for preview.
- UX7: Download button SHALL show a confirmation dialog before initiating download.
- UX8: Delete button SHALL show a confirmation dialog before soft-deleting the attachment.
- UX9: Attach file button SHALL open a native file picker filtered to allowed MIME types.

## UI States Matrix

| State            | Network | Data                              | Attachments UI                                              |
|------------------|---------|-----------------------------------|-------------------------------------------------------------|
| Loading          | any     | loading                           | Skeleton/spinner in attachments section                     |
| Empty            | any     | no attachments                    | "No attachments" message + attach button                    |
| With data        | online  | has attachments                   | Attachment list + attach button                             |
| Offline cached   | offline | has cached files                  | Attachment list (files viewable from cache)                 |
| Offline uncached | offline | has attachments, files not cached | Attachment list (preview unavailable, download unavailable) |
| Upload pending   | offline | file attached but not synced      | Attachment shown with pending indicator                     |
| Error            | any     | upload failed                     | Error message, retry option                                 |

## Behavior

Behavior specifications will be defined in:
- `features/file-validation.feature` (@add-file-attachments @FR1 @FR2 @FR3)
- `features/attachment-crud.feature` (@add-file-attachments @FR5 @FR8 @FR13 @FR16)
- `features/attachment-sync.feature` (@add-file-attachments @FR6 @FR7 @FR14 @FR15)
- `features/file-viewer.feature` (@add-file-attachments @FR9 @FR10 @FR11)
- `features/file-download.feature` (@add-file-attachments @FR12)

## Visual Reference

No Figma designs. Implementation follows existing design patterns:
- Tab buttons: same pill style as task detail panel (Details/Checklist)
- Lightbox: extends existing CoverLightbox pattern
- Attachment list: similar to checklist items layout (icon + text + actions)
- Confirmation dialogs: same overlay pattern as existing delete confirmations

## Affected IA

Requires IA update:
- Task detail panel: new Attachments tab
- Goal edit mode: restructured with Details/Attachments tabs
- Goal view mode: unified collapsible details section (single chevron for description + attachments)
- Idea detail panel: new attachments section

## Capabilities

### New Capabilities

- `file-attachments`: Attachment entity, CRUD operations, sync protocol integration, file validation (MIME allowlist, magic bytes, size limits)
- `file-viewer`: Lightbox modal for previewing images, PDFs, and text files with download support

### Modified Capabilities

- `cover-sync-protocol`: Renamed to generic file operations (uploadFile, getFile, deleteFile). `deleteFile` uses dynamic reference counting (idempotent). Purge cleans up orphaned files as safety net. `ref_count` column removed.
- `sync-protocol`: PullResponse and PushRequest extended with `attachments[]` field.
- `task-detail-panel`: Third tab (Attachments) added to task editing panel.
- `goal-detail-card`: View mode gets unified collapsible details section (description + attachments via single chevron). Edit mode restructured with Details/Attachments tabs.
- `ideas`: Idea detail panel gets attachments section below description.

## Success Metrics

- M1: All allowed file types (image/jpeg, image/png, image/webp, image/gif, text/plain, text/markdown, application/pdf) can be attached, viewed, and downloaded
- M2: Files are available offline after initial cache
- M3: Attachments sync reliably between devices (create, delete, purge cleans up orphaned files)
- M4: Mutation testing score >= 95% on new services (FileService, AttachmentService, FileSyncService)
- M5: Zero cover regression — existing cover functionality works identically after rename
- M6: Magic bytes validation rejects files with spoofed MIME types

## Open Questions

- Q1: Should attachment sort_order be editable (drag-and-drop reorder) or fixed by creation order? Decision: start with creation order, add drag-and-drop later if needed.
- Q2: Maximum number of attachments per entity? Decision: no limit for now, revisit if performance issues arise.

## Known Limitations

- KL1: **Purge-before-sync ghost records.** If Device A soft-deletes and purges a record before Device B syncs, Device B never learns about the soft-delete (the record is gone from the server). Device B still has the record locally as active and will re-create it on next push. This is an existing limitation of the sync/purge protocol, not specific to file attachments. For files: the purge may delete an orphaned file, and when Device B re-pushes the attachment, the file would need to be re-uploaded (from pending_files queue or via reupload). See scenario analysis in `design.md` D12.
