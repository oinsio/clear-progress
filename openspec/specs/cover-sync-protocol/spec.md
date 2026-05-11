## ADDED Requirements

### Requirement: Single cover upload with deduplication
The system SHALL upload a goal cover image to Google Drive via `uploadCover(UploadCoverRequest)`. The server SHALL compute SHA-256 hash of the image data and check for existing files with the same hash. If a match exists, the existing file ID is returned with `reused: true`.

#### Scenario: New cover uploaded successfully
- **WHEN** client uploads a cover with unique SHA-256 hash
- **THEN** server creates a new file in Drive
- **AND** returns `{ file_id, reused: false }`

#### Scenario: Duplicate cover detected by hash
- **WHEN** client uploads a cover with SHA-256 hash matching an existing file
- **THEN** server returns existing file's ID with `{ file_id, reused: true }`
- **AND** no new file is created

#### Scenario: Server stores hash in file description
- **WHEN** a new cover is uploaded
- **THEN** SHA-256 hash is stored in the Drive file's description field for future dedup lookups

### Requirement: Cover upload validation
The server SHALL validate cover uploads before processing.

#### Scenario: Invalid MIME type rejected
- **WHEN** `mime_type` does not start with "image/"
- **THEN** upload is rejected with error

#### Scenario: Oversized cover rejected
- **WHEN** decoded image data exceeds 2 MB
- **THEN** upload is rejected with error

#### Scenario: Hash mismatch detected
- **WHEN** `data_hash` in request does not match server-computed SHA-256
- **THEN** upload is rejected with error

### Requirement: Batch cover upload
The system SHALL support uploading multiple covers in a single request via `uploadCovers(UploadCoversRequest)`. Maximum batch size is 10 items.

#### Scenario: Batch upload processes all items
- **WHEN** client sends batch of 5 covers
- **THEN** server processes each independently
- **AND** returns array of results with per-item status

#### Scenario: Partial batch failure
- **WHEN** batch of 3 covers is sent, 1 has invalid MIME type
- **THEN** 2 succeed and 1 fails
- **AND** results reflect individual statuses

#### Scenario: Batch size limit
- **WHEN** batch exceeds 10 items
- **THEN** request is rejected

### Requirement: Cover download
The system SHALL download cover images by file IDs via `getCover(GetCoverRequest)`. Multiple file IDs can be requested at once.

#### Scenario: Successful cover download
- **WHEN** client requests covers by valid file IDs
- **THEN** server returns base64-encoded image data and MIME type for each

#### Scenario: Missing cover returns error per item
- **WHEN** one of the requested file IDs does not exist
- **THEN** that item has `error` field set
- **AND** other items are returned normally

### Requirement: Cover delete with reference counting
The system SHALL delete a cover via `deleteCover(DeleteCoverRequest)`. The server SHALL track reference count — the cover file is only deleted from Drive when no goals reference it.

#### Scenario: Cover deleted when no other references
- **WHEN** cover is referenced by only 1 goal and that goal requests deletion
- **THEN** file is deleted from Drive
- **AND** response has `deleted: true, ref_count: 0`

#### Scenario: Cover reference decremented but file kept
- **WHEN** cover is referenced by 2 goals and 1 goal requests deletion
- **THEN** file is NOT deleted from Drive
- **AND** response has `deleted: false, ref_count: 1`

### Requirement: Local cover lifecycle
The client SHALL manage a local cover lifecycle: pending (not yet uploaded) → confirmed (uploaded, has server file_id). Covers with `"local:"` prefix in `cover_file_id` are pending.

#### Scenario: New cover starts as pending
- **WHEN** user selects a cover image for a goal
- **THEN** cover is stored in IndexedDB with `cover_file_id` prefixed with `"local:"`
- **AND** cover image is cached as Blob URL for display

#### Scenario: Cover sync moves pending to confirmed
- **WHEN** `CoverSyncService.sync()` runs
- **THEN** pending covers are batch-uploaded to server
- **AND** on success, `cover_file_id` is updated to server's `file_id` (without `"local:"` prefix)
- **AND** `needsSync` is set to `true` on the goal (to push new file_id)

#### Scenario: Cover sync initializes on app load
- **WHEN** `CoverSyncService.initializeLocalCovers()` runs
- **THEN** all covers (pending and confirmed) are loaded into memory as Blob URLs

### Requirement: Full sync reupload covers
During full sync (T7), the system SHALL reupload all covers to ensure server has them. SHA-256 dedup prevents duplicate storage.

#### Scenario: Reupload triggers dedup
- **WHEN** full sync calls `reuploadLocalCovers()`
- **AND** server already has the cover (same hash)
- **THEN** server returns `reused: true`
- **AND** no duplicate file is created

#### Scenario: Full sync downloads missing server covers
- **WHEN** full sync calls `ensureServerCoversAreCached()`
- **THEN** all covers referenced by active goals are downloaded and cached in IndexedDB
