# Capability: File Attachments (delta)

## MODIFIED Requirements

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
