## Requirements

### Requirement: Single file upload with deduplication
The system SHALL upload a goal cover image to the server via `uploadCover(UploadCoverRequest)`. The server SHALL compute SHA-256 hash of the image data and check for existing files with the same hash. If a match exists, `reused: true` is returned. The response SHALL contain `data_hash` — the server SHALL NOT expose storage-specific file IDs to the client.

#### Scenario: New cover uploaded successfully
- **WHEN** client uploads a cover with unique SHA-256 hash
- **THEN** server stores the file
- **AND** returns `{ data_hash, reused: false }`

#### Scenario: Duplicate cover detected by hash
- **WHEN** client uploads a cover with SHA-256 hash matching an existing file
- **THEN** server returns `{ data_hash, reused: true }`
- **AND** no new file is created

#### Scenario: Server stores hash in file description
- **WHEN** a new cover is uploaded
- **THEN** SHA-256 hash is stored in the Drive file's description field for future dedup lookups

### Requirement: File upload validation
The server SHALL validate file uploads before processing. MIME type SHALL be checked against the unified allowlist from `packages/contract`. File content SHALL be validated via magic bytes. Size limit SHALL be 2 MB for covers and 5 MB for attachments.

#### Scenario: Invalid MIME type rejected
- **WHEN** `mime_type` is not in the unified allowlist (`ALLOWED_FILE_MIME_TYPES`)
- **THEN** upload is rejected with error

#### Scenario: Oversized cover rejected
- **WHEN** decoded file data exceeds 2 MB and the file is a cover upload
- **THEN** upload is rejected with error

#### Scenario: Oversized attachment rejected
- **WHEN** decoded file data exceeds 5 MB and the file is an attachment upload
- **THEN** upload is rejected with error

#### Scenario: Hash mismatch detected
- **WHEN** `data_hash` in request does not match server-computed SHA-256
- **THEN** upload is rejected with error

#### Scenario: Magic bytes mismatch rejected
- **WHEN** file content magic bytes do not match the declared `mime_type`
- **THEN** upload is rejected with error

### Requirement: Batch file upload
The system SHALL support uploading multiple covers in a single request via `uploadCovers(UploadCoversRequest)`. Maximum batch size is 10 items. Each result SHALL contain `data_hash` instead of `file_id`.

#### Scenario: Batch upload processes all items
- **WHEN** client sends batch of 5 covers
- **THEN** server processes each independently
- **AND** returns array of results with per-item `data_hash` and status

#### Scenario: Partial batch failure
- **WHEN** batch of 3 covers is sent, 1 has invalid MIME type
- **THEN** 2 succeed and 1 fails
- **AND** results reflect individual statuses

#### Scenario: Batch size limit
- **WHEN** batch exceeds 10 items
- **THEN** request is rejected

### Requirement: File download by hash
The system SHALL download cover images by content hash via `getCover(GetCoverRequest)`. The request SHALL accept `{ hashes: string[] }` and return cover data keyed by hash.

#### Scenario: Successful cover download
- **WHEN** client requests covers by valid hashes
- **THEN** server returns base64-encoded image data and MIME type for each, keyed by hash

#### Scenario: Missing cover returns error per item
- **WHEN** one of the requested hashes does not match any stored cover
- **THEN** that item has `error` field set
- **AND** other items are returned normally

### Requirement: File delete with dynamic reference counting
The system SHALL delete a file via `deleteFile(DeleteFileRequest)`. The request SHALL accept `{ hash }`. The server SHALL dynamically count actual references from `goals.cover_hash` and `attachments.data_hash` (including soft-deleted records) instead of maintaining a stored `ref_count` counter. The file is only deleted from storage when total reference count is zero. This ensures idempotent behavior — multiple calls with the same hash are safe. Implements FR7 of add-file-attachments.

#### Scenario: File deleted when no references remain
- **WHEN** file hash H1 is not referenced by any goal's cover_hash
- **AND** H1 is not referenced by any attachment (active or soft-deleted)
- **THEN** file is deleted from storage
- **AND** response has `deleted: true, ref_count: 0`

#### Scenario: File kept when goal cover references it
- **WHEN** file hash H1 is referenced by goal G1's cover_hash
- **AND** H1 has no attachment references
- **THEN** file is NOT deleted from storage
- **AND** response has `deleted: false, ref_count: 1`

#### Scenario: File kept when active attachment references it
- **WHEN** file hash H1 is not referenced by any goal's cover_hash
- **AND** H1 is referenced by 2 attachments (active or soft-deleted)
- **THEN** file is NOT deleted from storage
- **AND** response has `deleted: false, ref_count: 2`

#### Scenario: File kept when both cover and attachment reference it
- **WHEN** file hash H1 is referenced by 1 goal's cover_hash and 1 attachment
- **THEN** file is NOT deleted from storage
- **AND** response has `deleted: false, ref_count: 2`

#### Scenario: Idempotent delete — two devices remove same cover, another goal still references file
- **GIVEN** goal G1 has cover_hash = H1, goal G2 has cover_hash = H1
- **WHEN** Device A removes cover from G1 (G1.cover_hash = "") and calls deleteFile({ hash: H1 })
- **AND** Device B removes cover from G1 (duplicate, not yet synced) and calls deleteFile({ hash: H1 })
- **THEN** both calls return `deleted: false, ref_count: 1` (G2 still references H1)
- **AND** file is NOT deleted from storage

#### Scenario: Soft-deleted attachment counts as reference — file stays after deleteFile
- **GIVEN** attachment A1 (data_hash H1) is the only reference to file H1
- **WHEN** A1 is soft-deleted (is_deleted=true) and client calls deleteFile({ hash: H1 })
- **THEN** server counts A1 as a reference (soft-deleted records count)
- **AND** response has `deleted: false, ref_count: 1`
- **AND** file H1 is NOT deleted from storage

#### Scenario: Cover removed from goal (goal not deleted) — file deleted immediately if no other refs
- **GIVEN** goal G1 has cover_hash = H1, no other goals or attachments reference H1
- **WHEN** user removes cover from G1 (G1.cover_hash = "") and client calls deleteFile({ hash: H1 })
- **THEN** server counts 0 goals + 0 attachments referencing H1
- **AND** response has `deleted: true, ref_count: 0`
- **AND** file H1 is deleted from storage

#### Scenario: Two attachments same hash — delete first — file stays
- **GIVEN** attachment A1 (task T1, data_hash H1) and attachment A2 (task T2, data_hash H1)
- **WHEN** A1 is soft-deleted and client calls deleteFile({ hash: H1 })
- **THEN** server counts A1 (soft-deleted) + A2 (active) = 2 references
- **AND** response has `deleted: false, ref_count: 2`

#### Scenario: Two attachments same hash — delete both — file stays until purge
- **GIVEN** attachment A1 and A2 both reference data_hash H1, both are soft-deleted
- **WHEN** client calls deleteFile({ hash: H1 })
- **THEN** server counts A1 + A2 (both soft-deleted but still in DB) = 2 references
- **AND** response has `deleted: false, ref_count: 2`
- **AND** file H1 is NOT deleted (awaits purge to hard-delete A1 and A2)

#### Scenario: Cover + attachment same hash — delete cover — file stays
- **GIVEN** goal G1 has cover_hash = H1, attachment A1 has data_hash = H1
- **WHEN** user removes cover from G1 (G1.cover_hash = "") and calls deleteFile({ hash: H1 })
- **THEN** server counts 0 goals + 1 attachment = 1 reference
- **AND** response has `deleted: false, ref_count: 1`

### Requirement: Local file lifecycle
The client SHALL manage a local cover lifecycle: pending (not yet uploaded) to confirmed (uploaded to server). The cover identifier SHALL be the SHA-256 `data_hash`, computed client-side at file selection time. There SHALL be no `"local:"` prefix — the hash is the final, stable identifier from the moment of selection.

#### Scenario: New cover starts as pending
- **WHEN** user selects a cover image for a goal
- **THEN** SHA-256 hash is computed client-side
- **AND** `goal.cover_hash` is set to the computed hash immediately
- **AND** cover data is saved to `pending_covers` table with `data_hash` as primary key
- **AND** cover image is cached as Blob URL for display

#### Scenario: Cover sync moves pending to confirmed
- **WHEN** `CoverSyncService.sync()` runs
- **THEN** pending covers are batch-uploaded to server
- **AND** on success, cover data moves from `pending_covers` to `covers` table
- **AND** `goal.cover_hash` remains unchanged (hash was already correct)

#### Scenario: Cover sync initializes on app load
- **WHEN** `CoverSyncService.initializeLocalCovers()` runs
- **THEN** all covers (pending and confirmed) are loaded into memory as Blob URLs

### Requirement: File cleanup at purge (safety net)
The purge operation SHALL clean up orphaned files as a safety net after hard-deleting `is_deleted=true` records. After deleting records from all entity tables, the server SHALL identify files in the `files` table that are no longer referenced by any `goals.cover_hash` or any `attachments.data_hash`, and delete them from storage. This catches files that `deleteFile` could not clean up (e.g., soft-deleted records blocking deletion). Implements FR17 of add-file-attachments.

#### Scenario: Orphaned file deleted during purge
- **GIVEN** attachment A1 (data_hash H1) is the only reference to file H1
- **AND** A1 is soft-deleted (is_deleted=true)
- **WHEN** purge runs and hard-deletes A1
- **THEN** file H1 has zero references
- **AND** file H1 is deleted from storage

#### Scenario: Shared file kept during purge
- **GIVEN** attachment A1 (data_hash H1) is soft-deleted
- **AND** goal G1 has cover_hash = H1
- **WHEN** purge runs and hard-deletes A1
- **THEN** file H1 still has 1 reference (G1.cover_hash)
- **AND** file H1 is NOT deleted from storage

#### Scenario: File kept when active attachment remains after purge
- **GIVEN** attachment A1 (data_hash H1, is_deleted=false) exists
- **AND** attachment A2 (data_hash H1, is_deleted=true) exists
- **WHEN** purge runs and hard-deletes A2
- **THEN** file H1 still has 1 reference (A1)
- **AND** file H1 is NOT deleted from storage

#### Scenario: Purge cleans up file orphaned by cover removal
- **GIVEN** goal G1 had cover_hash = H1, then user removed cover (G1.cover_hash = "")
- **AND** no attachments reference H1
- **AND** deleteFile was never called (e.g., user was offline during cover removal)
- **WHEN** purge runs (even with no is_deleted records to delete)
- **THEN** file H1 has zero references
- **AND** file H1 is deleted from storage

### Requirement: Client-side local file cache ref-counting

The client `FileService.deleteFile` SHALL check local references before removing a file from `localFileCache` and `pendingFileRepository`/`fileRepository`. A file SHALL only be removed from local cache when it has zero remaining local references (from `goals.cover_hash` and active `attachments.data_hash`). This prevents breaking cover display when a co-referencing attachment is deleted. Implements FR7, FR18 of add-file-attachments.

#### Scenario: Cover preserved when same-hash attachment is deleted offline

- **GIVEN** goal G1 has cover_hash = H1 (file in pending_files, displayed via localFileCache)
- **AND** attachment A1 (entity_type "goal", entity_id G1, data_hash H1) exists
- **WHEN** user deletes attachment A1 (soft-delete + deleteFile)
- **THEN** localFileCache still has the blob URL for H1
- **AND** goal G1's cover is still displayed

#### Scenario: File removed from local cache when no local refs remain

- **GIVEN** attachment A1 is the only local reference to file H1 (no goal cover uses H1)
- **WHEN** user deletes attachment A1 and deleteFile is called
- **AND** server returns `deleted: true`
- **THEN** file H1 is removed from fileRepository and localFileCache

#### Scenario: Pending file kept when goal cover still references it

- **GIVEN** goal G1 has cover_hash = H1 (file in pending_files)
- **AND** attachment A1 has data_hash = H1
- **WHEN** user deletes attachment A1
- **THEN** pending file H1 stays in pending_files
- **AND** localFileCache still has blob URL for H1

### Requirement: Full sync reupload files
During full sync, the system SHALL reupload all files referenced by active goals (via `cover_hash`) and active attachments (via `data_hash`) to ensure server has them. SHA-256 dedup prevents duplicate storage.

#### Scenario: Reupload covers triggers dedup
- **WHEN** full sync calls `reuploadLocalFiles()`
- **AND** server already has the cover file (same hash)
- **THEN** server returns `reused: true`
- **AND** no duplicate file is created

#### Scenario: Reupload attachment files
- **WHEN** full sync calls `reuploadLocalFiles()`
- **AND** active attachments reference files in local cache
- **THEN** those files are uploaded to server

#### Scenario: Full sync downloads missing server files
- **WHEN** full sync calls `ensureServerFilesAreCached()`
- **THEN** all files referenced by active goals (cover_hash) and active attachments (data_hash) are downloaded and cached in IndexedDB
