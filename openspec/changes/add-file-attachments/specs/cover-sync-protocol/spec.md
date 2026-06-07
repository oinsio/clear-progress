## RENAMED Requirements

### Requirement: Single cover upload with deduplication
- **FROM:** Single cover upload with deduplication
- **TO:** Single file upload with deduplication

### Requirement: Cover upload validation
- **FROM:** Cover upload validation
- **TO:** File upload validation

### Requirement: Batch cover upload
- **FROM:** Batch cover upload
- **TO:** Batch file upload

### Requirement: Cover download
- **FROM:** Cover download
- **TO:** File download by hash

### Requirement: Cover delete with reference counting
- **FROM:** Cover delete with reference counting
- **TO:** File delete with reference counting

### Requirement: Local cover lifecycle
- **FROM:** Local cover lifecycle
- **TO:** Local file lifecycle

### Requirement: Full sync reupload covers
- **FROM:** Full sync reupload covers
- **TO:** Full sync reupload files

## MODIFIED Requirements

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
