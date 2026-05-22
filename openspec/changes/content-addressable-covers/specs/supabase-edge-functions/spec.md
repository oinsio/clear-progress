## MODIFIED Requirements

### Requirement: Upload Cover Edge Function
The `/upload-cover` Edge Function SHALL accept POST requests with `{ goal_id, filename, mime_type, data, data_hash }`. It SHALL check for hash deduplication, store the file in Supabase Storage at path `{user_id[0:2]}/{user_id}/{data_hash[0:2]}/{file_id}.{ext}`, and create a record in the `covers` table. The response SHALL return `data_hash` instead of `file_id`.

#### Scenario: New cover uploaded
- **WHEN** user uploads a cover with unique `data_hash`
- **THEN** file is stored in Storage
- **AND** `covers` table gets a new row with `ref_count = 1`
- **AND** response is `{ ok: true, data_hash: "<hash>", reused: false }`

#### Scenario: Duplicate hash reuses existing cover
- **WHEN** user uploads a cover with `data_hash` matching an existing cover
- **THEN** `ref_count` is incremented on existing cover
- **AND** response is `{ ok: true, data_hash: "<hash>", reused: true }`

### Requirement: Upload Covers (batch) Edge Function
The `/upload-covers` Edge Function SHALL accept POST requests with `{ covers: [...] }` (up to 10 items). Each item SHALL be processed independently. Results SHALL contain `data_hash` instead of `file_id`. Invalid items SHALL return an error without affecting valid items.

#### Scenario: Batch upload succeeds
- **WHEN** user uploads 3 valid covers
- **THEN** all 3 are stored and results returned per item with `data_hash`

#### Scenario: Batch exceeds limit
- **WHEN** batch contains more than 10 items
- **THEN** response is `{ ok: false, results: [] }`

#### Scenario: Partial failure
- **WHEN** batch contains 1 valid image and 1 invalid mime type
- **THEN** valid image is stored, invalid item returns error

### Requirement: Get Cover Edge Function
The `/get-cover` Edge Function SHALL accept POST requests with `{ hashes: [...] }`. For each hash, it SHALL look up the cover in the `covers` table by `(user_id, data_hash)`, download the file from Storage, and return base64-encoded data. Missing covers SHALL return an error per item.

#### Scenario: Cover found
- **WHEN** user requests existing hash
- **THEN** response includes `{ hash, mime_type, data }` with base64-encoded content

#### Scenario: Cover not found
- **WHEN** user requests non-existent hash
- **THEN** response includes `{ hash, error: "File not found" }`

### Requirement: Delete Cover Edge Function
The `/delete-cover` Edge Function SHALL accept POST requests with `{ hash, goal_id }`. It SHALL look up the cover by `(user_id, data_hash)`, decrement `ref_count`. When `ref_count` reaches 0, it SHALL delete the file from Storage and remove the `covers` table row.

#### Scenario: Shared cover decremented
- **WHEN** cover has `ref_count > 1`
- **THEN** `ref_count` is decremented
- **AND** response is `{ ok: true, deleted: false, ref_count: <new_count> }`

#### Scenario: Last reference deleted
- **WHEN** cover has `ref_count = 1`
- **THEN** file is deleted from Storage
- **AND** `covers` row is deleted
- **AND** response is `{ ok: true, deleted: true, ref_count: 0 }`
