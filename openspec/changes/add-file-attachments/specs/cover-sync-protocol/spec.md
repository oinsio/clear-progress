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

### Requirement: File delete with reference counting
The system SHALL delete a file via `deleteFile(DeleteFileRequest)`. The request SHALL accept `{ hash }`. The server SHALL count references from both `goals.cover_hash` and active (non-deleted) `attachments.data_hash`. The file is only deleted from storage when total reference count is zero.

#### Scenario: File deleted when no references remain
- **WHEN** file hash H1 is not referenced by any goal's cover_hash
- **AND** H1 is not referenced by any active attachment
- **THEN** file is deleted from storage
- **AND** response has `deleted: true, ref_count: 0`

#### Scenario: File kept when goal cover references it
- **WHEN** file hash H1 is referenced by goal G1's cover_hash
- **AND** H1 has no active attachment references
- **THEN** file is NOT deleted from storage
- **AND** response has `deleted: false, ref_count: 1`

#### Scenario: File kept when attachment references it
- **WHEN** file hash H1 is not referenced by any goal's cover_hash
- **AND** H1 is referenced by 2 active attachments
- **THEN** file is NOT deleted from storage
- **AND** response has `deleted: false, ref_count: 2`

#### Scenario: File kept when both cover and attachment reference it
- **WHEN** file hash H1 is referenced by 1 goal's cover_hash and 1 active attachment
- **THEN** file is NOT deleted from storage
- **AND** response has `deleted: false, ref_count: 2`

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
