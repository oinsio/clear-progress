## ADDED Requirements

### Requirement: Get File Edge Function handles files up to maximum allowed size

The `/get-file` Edge Function SHALL encode downloaded file blobs to base64 using chunked `String.fromCharCode` (chunk size 8192 bytes) to avoid exceeding the JavaScript call stack limit. The function SHALL successfully return base64-encoded data for files up to 5 MB (MAX_ATTACHMENT_SIZE_BYTES). Implements FR1 of fix-get-file-large-payload.

#### Scenario: Small file returned successfully

- **WHEN** user requests a file smaller than 64 KB by hash
- **THEN** response includes `{ hash, mime_type, data }` with correct base64-encoded content

#### Scenario: Large file returned successfully

- **WHEN** user requests a file of 200 KB by hash
- **THEN** response includes `{ hash, mime_type, data }` with correct base64-encoded content
- **AND** the base64 data decodes to the original file bytes

#### Scenario: File at maximum allowed size returned successfully

- **WHEN** user requests a file of 5 MB by hash
- **THEN** response includes `{ hash, mime_type, data }` with correct base64-encoded content
- **AND** no stack overflow or 500 error occurs
