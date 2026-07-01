# fix-file-mime-detection

## Why

Users cannot upload files whose extension does not match their actual content (e.g., a WebP image saved as `.png`). The browser reports MIME type based on the file extension, and magic-bytes validation correctly rejects the mismatch — but the user sees only a generic "Failed to upload cover" error with no actionable guidance. The system should detect the real file format from content and show specific error messages.

## What Changes

- **ADDED**: `detectMimeType(buffer)` function in `packages/contract` that determines the real MIME type from magic bytes, independent of the browser-reported `file.type`
- **MODIFIED**: `FileService.uploadFile()` — use detected MIME type instead of `file.type` for validation and storage
- **MODIFIED**: `AttachFileButton` — use detected MIME type for early validation instead of trusting `file.type`
- **MODIFIED**: `useGoalEditForm` — parse specific error codes and show corresponding user-facing messages
- **MODIFIED**: Locales (ru, en, house) — add error message keys for each failure reason
- **MODIFIED**: Server-side Edge Functions (`upload-file`, `upload-files`) — use `detectMimeType` instead of trusting client-declared `mime_type`

## Capabilities

### New Capabilities

- `mime-detection`: Content-based MIME type detection from magic bytes, replacing browser-reported file.type
- `upload-error-messages`: Specific, localized error messages for each file upload failure reason

### Modified Capabilities

- `file-attachments`: Magic bytes validation now detects real MIME type instead of comparing against declared type. Upload error handling provides typed errors with specific user-facing messages.

## Goals

- G1: Files with mismatched extension/content are accepted when the real format is in the allowlist
- G2: Users see specific, actionable error messages for every upload failure reason

## Non-Goals

- NG1: Expanding the list of allowed MIME types
- NG2: Changing file size limits
- NG3: Auto-converting between image formats

## Users & Scenarios

- U1: User downloads an image from the web; browser saves it as `.png` but the actual format is WebP. User tries to set it as a goal cover — should succeed.
- U2: User renames a `.exe` file to `.png` and tries to upload — should see "Format not supported" error, not a generic failure.
- U3: User tries to upload a 5 MB photo as a cover (limit 2 MB) — should see "File too large (max 2 MB)" error.

## Requirements

### Functional

- FR1: The system SHALL detect real MIME type from file content (magic bytes), not from browser-reported `file.type` or file extension
- FR2: If the detected MIME type is in `ALLOWED_FILE_MIME_TYPES`, the file SHALL be accepted regardless of its extension or browser-reported type
- FR3: If magic bytes do not match any known signature (unrecognizable format), the file SHALL be rejected with a specific error
- FR4: The detected MIME type (not the browser-reported one) SHALL be used for storage, pending records, and server upload payload
- FR5: `FileService.uploadFile()` SHALL throw typed errors distinguishing: unsupported format, unrecognized format, file too large
- FR6: Cover upload UI SHALL display specific error messages for each failure reason instead of a generic error
- FR7: `AttachFileButton` SHALL use magic-bytes detection for early MIME validation before passing the file to `AttachmentService`
- FR8: Server-side upload functions SHALL detect real MIME type from decoded file content, not trust the client-declared `mime_type` field

### Non-Functional

#### Accessibility

- NFR-A1: Error messages SHALL be announced to screen readers (role="alert" or aria-live)

## UX Acceptance Criteria

- UX1: When upload fails due to unsupported format, user sees: "File format not supported. Allowed: JPEG, PNG, WebP, GIF, PDF, TXT" (localized)
- UX2: When upload fails due to unrecognizable content, user sees: "Could not determine file format. The file may be corrupted." (localized)
- UX3: When upload fails due to file size, user sees: "File is too large. Maximum size: 2 MB" (for covers) or "5 MB" (for attachments) (localized)
- UX4: When upload fails due to network error, user sees: "Upload failed. The file is saved locally and will be uploaded when connection is restored." (localized)
- UX5: Error messages disappear after 5 seconds or on next user action

## Behavior

Reference: `features/file_mime_detection.feature` (`@fix-file-mime-detection` tags)

## Visual Reference

No visual changes beyond error message text. Existing error display patterns are reused.

## Affected IA

No changes.

## Success Metrics

- M1: A WebP file saved with `.png` extension uploads successfully as a cover
- M2: All 5 error scenarios (unsupported type, unrecognized format, too large, network error, text with null bytes) show distinct user-facing messages
- M3: Mutation score >= 95% on `detectMimeType` and modified `FileService` code

## Open Questions

None — resolved in design.md (D2: text fallback, D5: server uses detected type).
