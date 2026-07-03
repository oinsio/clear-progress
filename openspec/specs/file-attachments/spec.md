# Capability: File Attachments

## Purpose

Attach files (images, PDFs, text) to tasks, goals, and ideas with offline support, validation, and sync. Provides unified MIME/magic-bytes validation, size limits, attachment entity lifecycle, and pending upload queue.

## Requirements

### Requirement: Unified MIME type allowlist

The system SHALL define an allowlist of permitted file MIME types in `packages/contract` as the single source of truth: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `text/plain`, `application/pdf`. Both client and server SHALL import this allowlist for validation. Files with MIME types not in the allowlist SHALL be rejected. Implements FR1 of add-file-attachments.

#### Scenario: Allowed MIME type accepted

- **WHEN** user selects a file with MIME type `image/png`
- **THEN** the file passes MIME validation

#### Scenario: Disallowed MIME type rejected

- **WHEN** user selects a file with MIME type `application/zip`
- **THEN** the file is rejected with a validation error

#### Scenario: HTML files rejected

- **WHEN** user selects a file with MIME type `text/html`
- **THEN** the file is rejected with a validation error

### Requirement: Magic bytes validation

The system SHALL detect the real MIME type from file content using `detectMimeType(buffer)` instead of comparing magic bytes against the browser-declared MIME type. If the detected type is in `ALLOWED_FILE_MIME_TYPES`, the file SHALL be accepted regardless of its extension or browser-reported type. The detected MIME type SHALL be used for all downstream operations: upload payload (`mime_type` field), blob storage, pending file records. For text types where `detectMimeType` returns `null`, the system SHALL fall back to browser-reported type and validate via null-byte checking. Implements FR1, FR2, FR4 of fix-file-mime-detection.

#### Scenario: JPEG with correct magic bytes passes

- **WHEN** file declares MIME `image/jpeg` and starts with bytes `FF D8 FF`
- **THEN** magic bytes detection returns `image/jpeg` and file is accepted

#### Scenario: WebP file with .png extension accepted

- **WHEN** file has extension `.png` (browser reports `image/png`) but content starts with RIFF+WEBP bytes
- **THEN** `detectMimeType` returns `"image/webp"`, file is accepted as WebP

#### Scenario: PDF with correct signature passes

- **WHEN** file declares MIME `application/pdf` and starts with bytes `25 50 44 46` (%PDF)
- **THEN** magic bytes detection returns `application/pdf` and file is accepted

#### Scenario: Text file with no null bytes passes

- **WHEN** file declares MIME `text/plain` and first 8192 bytes contain no null bytes
- **THEN** `detectMimeType` returns `null`, fallback to browser type, null-byte check passes

#### Scenario: Text file with null bytes rejected

- **WHEN** file declares MIME `text/plain` but contains null bytes in first 8192 bytes
- **THEN** `detectMimeType` returns `null`, fallback to browser type, null-byte check fails and file is rejected

#### Scenario: Unknown binary format rejected

- **WHEN** file content matches no known magic bytes and browser type is not a text type
- **THEN** file is rejected with `UNRECOGNIZED_FORMAT` error

#### Scenario: Detected type used in upload payload

- **WHEN** a WebP file with `.png` extension is uploaded successfully
- **THEN** the upload payload `mime_type` field contains `"image/webp"` (not `"image/png"`)

#### Scenario: Detected type used in local blob storage

- **WHEN** a WebP file with `.png` extension is stored locally
- **THEN** the Blob is created with type `"image/webp"`

### Requirement: File size limits

The system SHALL enforce size limits: 2 MB for cover images, 5 MB for attachments. Limits SHALL be defined in `packages/contract`. Validation SHALL occur on both client (before upload) and server (before storage). Implements FR3 of add-file-attachments.

#### Scenario: Attachment within size limit accepted

- **WHEN** user attaches a 3 MB PDF file
- **THEN** the file passes size validation

#### Scenario: Attachment exceeding size limit rejected

- **WHEN** user attaches a 6 MB PDF file
- **THEN** the file is rejected with a size limit error

#### Scenario: Cover within its own limit accepted

- **WHEN** user sets a 1.5 MB cover image
- **THEN** the file passes size validation (2 MB limit for covers)

### Requirement: Attachment entity

The system SHALL support `Attachment` as a synced entity with fields: `id` (UUID v4, client-generated), `entity_type` (`"task"` | `"goal"` | `"idea"`), `entity_id` (UUID), `data_hash` (SHA-256), `filename` (original name), `mime_type`, `file_size` (bytes), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `revision`. Implements FR5 of add-file-attachments.

#### Scenario: Attachment created with all fields

- **WHEN** user attaches a file "report.pdf" (1.2 MB, application/pdf) to task T1
- **THEN** an Attachment is created with id (UUID v4), entity_type "task", entity_id T1, data_hash (SHA-256 of file), filename "report.pdf", mime_type "application/pdf", file_size 1258291, sort_order (next available), is_deleted false, created_at and updated_at set to current time, revision 0

#### Scenario: Attachment sort_order defaults to end of list

- **GIVEN** task T1 has 3 active attachments
- **WHEN** user attaches a new file to T1
- **THEN** new attachment has sort_order = 3

### Requirement: Attach file to entity

Users SHALL be able to attach files to tasks, goals, and ideas. The attachment operation SHALL validate the file (MIME, magic bytes, size), compute SHA-256 hash, upload the file to server (or queue as pending if offline), create an Attachment record, and store the blob in IndexedDB for offline access. Implements FR8 of add-file-attachments.

#### Scenario: Attach file to task online

- **WHEN** user attaches "notes.txt" to task T1 while online
- **THEN** file is uploaded to server, blob is cached in IndexedDB, Attachment record is created with needsSync true

#### Scenario: Attach file to goal online

- **WHEN** user attaches "reference.pdf" to goal G1 while online
- **THEN** file is uploaded, Attachment record links to entity_type "goal" and entity_id G1

#### Scenario: Attach file to idea online

- **WHEN** user attaches "sketch.png" to idea I1 while online
- **THEN** file is uploaded, Attachment record links to entity_type "idea" and entity_id I1

#### Scenario: Attach file while offline

- **WHEN** user attaches "doc.pdf" to task T1 while offline
- **THEN** file is saved to pending_files queue, blob is cached in IndexedDB for display, Attachment record is created with needsSync true
- **AND** file is uploaded to server on next successful sync

#### Scenario: Duplicate file attached to different entities

- **GIVEN** file with SHA-256 hash H1 is already attached to task T1
- **WHEN** user attaches the same file to goal G1
- **THEN** a new Attachment record is created (different id, same data_hash H1)
- **AND** the file blob is not duplicated in IndexedDB (same data_hash key)

### Requirement: Delete attachment

Users SHALL be able to soft-delete an attachment. Soft-delete SHALL set `is_deleted = true` and `needsSync = true`. After soft-delete, the client SHALL call `deleteFile` to attempt file cleanup. Because soft-deleted records still count as references in dynamic ref-counting, the file will stay on the server until purge hard-deletes the record. Implements FR7, FR13, FR16, FR18 of add-file-attachments.

#### Scenario: Soft-delete attachment

- **WHEN** user deletes attachment A1
- **THEN** A1 has is_deleted true, needsSync true, updated_at refreshed

#### Scenario: Delete requires confirmation

- **WHEN** user clicks the delete button on attachment A1
- **THEN** a confirmation dialog is shown
- **AND** attachment is only deleted if user confirms

#### Scenario: deleteFile called after soft-delete — file stays (soft-deleted record counts)

- **GIVEN** file H1 is referenced by only attachment A1
- **WHEN** A1 is soft-deleted and client calls deleteFile({ hash: H1 })
- **THEN** server counts A1 as a reference (is_deleted=true, but record exists)
- **AND** server returns `deleted: false, ref_count: 1`
- **AND** file H1 stays on server

#### Scenario: File removed from server at purge

- **GIVEN** attachment A1 (data_hash H1) is soft-deleted and synced
- **AND** no other attachment or cover references H1
- **WHEN** purge runs and hard-deletes A1
- **THEN** orphan check finds zero references to H1
- **AND** file H1 is deleted from server storage

#### Scenario: Soft-delete then undo — file still accessible

- **GIVEN** attachment A1 (data_hash H1) is the only reference to file H1
- **WHEN** user soft-deletes A1 and client calls deleteFile (file stays, ref_count=1)
- **AND** user undoes the deletion (A1.is_deleted = false)
- **THEN** file H1 is still on server and accessible

### Requirement: Attachment offline access

Attached files SHALL be stored as blobs in IndexedDB (`files` table) and available offline via `URL.createObjectURL`. On app load, `FileSyncService.initializeLocalFiles()` SHALL create blob URLs for all cached files. Implements FR14 of add-file-attachments.

#### Scenario: View attachment offline

- **GIVEN** user previously viewed attachment A1 (file cached in IndexedDB)
- **WHEN** user opens the app offline and views A1
- **THEN** the file is displayed from IndexedDB cache

#### Scenario: Uncached attachment unavailable offline

- **GIVEN** attachment A1 exists but its file has not been cached locally
- **WHEN** user tries to view A1 offline
- **THEN** the UI shows "Preview unavailable offline"

### Requirement: Pending file upload on sync

Files that fail to upload (due to being offline) SHALL be queued in `pending_files` table. On next sync, `FileSyncService.sync()` SHALL attempt to upload all pending files. On success, the file moves from `pending_files` to `files`. Implements FR15 of add-file-attachments.

#### Scenario: Pending file uploaded on reconnect

- **GIVEN** file F1 is in pending_files (created while offline)
- **WHEN** sync runs after network is restored
- **THEN** F1 is uploaded to server and moved from pending_files to files

#### Scenario: Upload failure keeps file in pending queue

- **GIVEN** file F1 is in pending_files
- **WHEN** sync runs but server returns an error
- **THEN** F1 remains in pending_files for next sync attempt

### Requirement: File download with confirmation

Users SHALL be able to download attached files. Clicking the download button SHALL show a confirmation dialog. On confirmation, the file SHALL be downloaded using a programmatically created `<a download>` element with a blob URL from IndexedDB. Implements FR12 of add-file-attachments.

#### Scenario: Download file after confirmation

- **WHEN** user clicks download on attachment "report.pdf"
- **THEN** a confirmation dialog is shown
- **AND** on confirmation, the file is downloaded with original filename "report.pdf"

#### Scenario: Download cancelled

- **WHEN** user clicks download on attachment "report.pdf"
- **AND** user clicks cancel in confirmation dialog
- **THEN** no download occurs

### Requirement: Server-side file size validation in upload-file

The `upload-file` edge function SHALL reject files exceeding `MAX_ATTACHMENT_SIZE_BYTES` (5 MB) with `ErrorCode.FILE_TOO_LARGE`. Size validation SHALL occur after base64 decode and before any database lookup or storage upload. Implements FR9, FR11 of attachment-drag-and-drop.

#### Scenario: File within size limit accepted

- **WHEN** a 3 MB file is uploaded via `upload-file`
- **THEN** the file passes size validation and proceeds to dedup check

#### Scenario: Oversized file rejected by upload-file

- **WHEN** a 6 MB file is uploaded via `upload-file`
- **THEN** server responds with `ErrorCode.FILE_TOO_LARGE` error

#### Scenario: Size check before database lookup

- **WHEN** a 6 MB file is uploaded via `upload-file`
- **THEN** no database query or storage upload is performed

### Requirement: Server-side file size validation in upload-files

The `upload-files` edge function SHALL reject per-file items exceeding `MAX_ATTACHMENT_SIZE_BYTES` (5 MB). The per-item result SHALL include `error_code: "FILE_TOO_LARGE"`. Other files in the batch SHALL continue processing normally. Implements FR10, FR11 of attachment-drag-and-drop.

#### Scenario: Oversized file rejected in batch

- **GIVEN** a batch of 3 files: 2 MB, 6 MB, 1 MB
- **WHEN** batch is uploaded via `upload-files`
- **THEN** file 1 and file 3 succeed
- **AND** file 2 result has `ok: false` and `error_code: "FILE_TOO_LARGE"`

#### Scenario: Size check per file in batch

- **WHEN** a batch contains one oversized file
- **THEN** only that file is rejected, other files proceed normally

### Requirement: Server-side size limit constant

`MAX_ATTACHMENT_SIZE_BYTES` SHALL be duplicated in `_shared/constants.ts` for Deno edge functions, following the same pattern as `ALLOWED_FILE_MIME_TYPES`. The value SHALL match `packages/contract/src/constants.ts`. Implements FR12 of attachment-drag-and-drop.

#### Scenario: Constant matches contract package

- **WHEN** `_shared/constants.ts` defines `MAX_ATTACHMENT_SIZE_BYTES`
- **THEN** its value equals `5 * 1024 * 1024` (5 MB), matching `packages/contract/src/constants.ts`
