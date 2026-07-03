# Capability: File Attachments

## ADDED Requirements

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
