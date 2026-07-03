# Capability: Upload Error Messages

## ADDED Requirements

### Requirement: Machine-readable error code in batch upload results

`UploadFileBatchResultSchema` SHALL include an `ok: z.boolean()` field for explicit per-item success/failure status and an `error_code: z.string().optional()` field for machine-readable error codes. Implements FR13, FR14 of attachment-drag-and-drop.

#### Scenario: Successful item has ok true

- **WHEN** a file in a batch upload succeeds
- **THEN** the per-item result has `ok: true`

#### Scenario: Failed item has ok false and error_code

- **WHEN** a file in a batch upload fails MIME validation
- **THEN** the per-item result has `ok: false` and `error_code: "INVALID_MIME_TYPE"`

#### Scenario: Size validation failure has error_code

- **WHEN** a file in a batch upload exceeds size limit
- **THEN** the per-item result has `ok: false` and `error_code: "FILE_TOO_LARGE"`

### Requirement: Error codes match ErrorCode enum

`processSingleFile` in `upload-files` SHALL return `error_code` values matching the `ErrorCode` enum defined in `_shared/constants.ts` for all error cases: `INVALID_PAYLOAD`, `INVALID_FILE_CONTENT`, `INVALID_MIME_TYPE`, `FILE_TOO_LARGE`, `INTERNAL_ERROR`. Implements FR15 of attachment-drag-and-drop.

#### Scenario: Invalid base64 returns INVALID_PAYLOAD code

- **WHEN** a batch item has invalid base64 data
- **THEN** per-item result has `error_code: "INVALID_PAYLOAD"`

#### Scenario: Unrecognized content returns INVALID_FILE_CONTENT code

- **WHEN** a batch item has unrecognizable file content
- **THEN** per-item result has `error_code: "INVALID_FILE_CONTENT"`

#### Scenario: Disallowed MIME returns INVALID_MIME_TYPE code

- **WHEN** a batch item has a MIME type not in the allowlist
- **THEN** per-item result has `error_code: "INVALID_MIME_TYPE"`

#### Scenario: Storage error returns INTERNAL_ERROR code

- **WHEN** a batch item fails during storage upload
- **THEN** per-item result has `error_code: "INTERNAL_ERROR"`

### Requirement: Rejected files error message for multi-file drop

When files are rejected during a multi-file drop, the error message SHALL list the filenames of rejected files. The message SHALL be localized and use `role="alert"` for screen reader announcement. Implements FR7, UX3, UX4 of attachment-drag-and-drop.

#### Scenario: Error lists rejected filenames

- **GIVEN** user drops 4 files, 2 are rejected (archive.zip, backup.exe)
- **WHEN** validation completes
- **THEN** error message contains "archive.zip, backup.exe"

#### Scenario: Error message localized

- **WHEN** rejected files error is shown
- **THEN** message text uses i18n key from locale files
