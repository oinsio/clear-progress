# Capability: Upload Error Messages

## Purpose

Specific, localized error messages for each file upload failure reason, replacing generic "Failed to upload" messages.

## Requirements

### Requirement: Typed upload error codes

`FileService.uploadFile()` SHALL throw errors with distinct message codes for each failure reason: `INVALID_TYPE` (detected type not in allowlist), `UNRECOGNIZED_FORMAT` (magic bytes match no known type and browser type is not text), `FILE_TOO_LARGE` (exceeds size limit). Implements FR5 of fix-file-mime-detection.

#### Scenario: Unsupported detected type throws INVALID_TYPE

- **WHEN** `detectMimeType` returns a MIME type not in `ALLOWED_FILE_MIME_TYPES`
- **THEN** `uploadFile` throws error with message `"INVALID_TYPE"`

#### Scenario: Unrecognizable format throws UNRECOGNIZED_FORMAT

- **WHEN** `detectMimeType` returns `null` and browser type is not a text type
- **THEN** `uploadFile` throws error with message `"UNRECOGNIZED_FORMAT"`

#### Scenario: Oversized file throws FILE_TOO_LARGE

- **WHEN** file size exceeds the provided size limit
- **THEN** `uploadFile` throws error with message `"FILE_TOO_LARGE"`

### Requirement: Cover upload error display

The cover upload flow (`useGoalEditForm`) SHALL map each error code to a specific, localized user-facing message instead of showing a generic error. Implements FR6 of fix-file-mime-detection.

#### Scenario: INVALID_TYPE shown for unsupported format

- **WHEN** cover upload fails with `INVALID_TYPE`
- **THEN** UI shows localized message listing allowed formats (UX1)

#### Scenario: UNRECOGNIZED_FORMAT shown for unknown content

- **WHEN** cover upload fails with `UNRECOGNIZED_FORMAT`
- **THEN** UI shows localized message about unrecognizable format (UX2)

#### Scenario: FILE_TOO_LARGE shown with size limit

- **WHEN** cover upload fails with `FILE_TOO_LARGE`
- **THEN** UI shows localized message with the maximum size (2 MB for covers) (UX3)

#### Scenario: Network error shown with offline guidance

- **WHEN** cover upload fails with a non-validation error (network/server)
- **THEN** UI shows localized message that file is saved locally (UX4)

### Requirement: Attachment upload error display

`AttachFileButton` SHALL use `detectMimeType` for early validation and display specific error messages matching the same error codes. Implements FR7 of fix-file-mime-detection.

#### Scenario: AttachFileButton shows unsupported format error

- **WHEN** user selects a file with unsupported detected MIME type
- **THEN** inline error shows localized unsupported format message

#### Scenario: AttachFileButton shows unrecognized format error

- **WHEN** user selects a file whose content matches no known signature and is not text
- **THEN** inline error shows localized unrecognizable format message

#### Scenario: AttachFileButton shows file too large error

- **WHEN** user selects a file exceeding 5 MB attachment limit
- **THEN** inline error shows localized size limit message with 5 MB

### Requirement: Error messages localized in all app languages

Error messages SHALL have keys in all locale files (ru.json, en.json, house.json). Implements FR6 of fix-file-mime-detection.

#### Scenario: Russian locale has all error keys

- **WHEN** app language is Russian
- **THEN** all upload error messages are displayed in Russian

#### Scenario: English locale has all error keys

- **WHEN** app language is English
- **THEN** all upload error messages are displayed in English

### Requirement: Error accessibility

Upload error messages SHALL be announced to screen readers using `role="alert"` or equivalent ARIA live region. Implements NFR-A1 of fix-file-mime-detection.

#### Scenario: Cover upload error announced to screen reader

- **WHEN** cover upload fails and error message appears
- **THEN** the error text is in an element with `role="alert"`

#### Scenario: Attachment error announced to screen reader

- **WHEN** attachment validation fails and error message appears
- **THEN** the error text is in an element with `role="alert"`

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
