# Attachment Drag-and-Drop

## Why

Desktop users cannot drag files from the OS into the app — they must click the attachment button and navigate the file picker every time. This adds friction for power users who manage multiple attachments. Additionally, the server does not validate file size, relying solely on client-side checks — a security gap that allows oversized files to be uploaded via direct API calls. The batch upload endpoint also lacks machine-readable error codes, making programmatic error handling unreliable.

## What Changes

- **ADDED**: File drop zone in attachment sections — drag files from OS directly into task/goal/idea attachment areas
- **ADDED**: Multi-file drop support with partial success handling (valid files attached, rejected file names shown)
- **ADDED**: Server-side file size validation in `upload-file` and `upload-files` edge functions
- **MODIFIED**: Extracted shared file validation logic from `AttachFileButton` into a reusable utility
- **MODIFIED**: Batch upload response schema — added `ok` and `error_code` fields for machine-readable per-item errors

## Goals

- G1: Reduce friction for attaching files on desktop by supporting native OS drag-and-drop
- G2: Enforce file size limits on the server as a security boundary
- G3: Provide machine-readable error codes in batch upload responses for reliable client-side error handling

## Non-Goals

- NG1: Drag-and-drop on mobile/touch devices — not a common interaction pattern, out of scope
- NG2: Separate size limits for covers vs attachments on server — unified 5 MB limit for now
- NG3: Drag-and-drop reordering of attachments — existing `@dnd-kit` handles list reordering, not file drops
- NG4: Global page-level drop zone — drop zone is scoped to attachment sections/tabs only

## Users & Scenarios

- U1: Desktop user drags a PDF from Finder/Explorer into the task attachments tab — file is attached without opening a file picker
- U2: Desktop user drags 5 files at once into goal attachments — 3 valid files are attached, 2 rejected filenames are shown in an error message
- U3: Malicious client sends a 10 MB file directly to the upload API — server rejects with `FILE_TOO_LARGE` error

## Requirements

### Functional

- FR1: `FileDropZone` component SHALL accept files dropped from the OS via native browser drag-and-drop API (`dragover`, `dragleave`, `drop` events)
- FR2: `FileDropZone` SHALL only activate when `dataTransfer.types` includes `"Files"` (ignore non-file drags)
- FR3: `FileDropZone` SHALL support multiple files in a single drop operation
- FR4: Each dropped file SHALL be validated using the same logic as `AttachFileButton`: magic bytes detection → MIME allowlist → size limit
- FR5: File validation logic SHALL be extracted from `AttachFileButton` into a shared utility function (`validateFile`)
- FR6: Valid files from a multi-file drop SHALL be attached sequentially (to ensure correct `sort_order` assignment)
- FR7: Rejected files SHALL be reported by filename in an error message (e.g., "Rejected: invoice.zip, backup.exe")
- FR8: `FileDropZone` SHALL be hidden on touch devices (via CSS `@media (pointer: fine)` or equivalent)
- FR9: `upload-file` edge function SHALL reject files exceeding `MAX_ATTACHMENT_SIZE_BYTES` (5 MB) with `ErrorCode.FILE_TOO_LARGE`
- FR10: `upload-files` edge function SHALL reject per-file items exceeding `MAX_ATTACHMENT_SIZE_BYTES` with `error_code: "FILE_TOO_LARGE"` in the per-item result
- FR11: Size validation SHALL occur after base64 decode and before any database or storage operations
- FR12: `MAX_ATTACHMENT_SIZE_BYTES` constant SHALL be duplicated in `_shared/constants.ts` for Deno edge functions (same pattern as `ALLOWED_FILE_MIME_TYPES`)
- FR13: `UploadFileBatchResultSchema` SHALL include `ok: z.boolean()` field for explicit per-item success/failure status
- FR14: `UploadFileBatchResultSchema` SHALL include `error_code: z.string().optional()` field for machine-readable error codes
- FR15: `processSingleFile` in `upload-files` SHALL return `error_code` matching `ErrorCode` enum values for all error cases

### Non-Functional

#### Accessibility — NFR-A1

- NFR-A1: Drop zone overlay SHALL have sufficient color contrast (WCAG 2.1 AA) and include text instructions

#### Responsive — NFR-R1

- NFR-R1: Drop zone SHALL not render on touch-only devices — no visual or interactive impact on mobile

## UX Acceptance Criteria

- UX1: When user drags files over the attachment section, a dashed-border overlay appears with instructional text (e.g., "Drop files here")
- UX2: When user drags files away from the drop zone or drops outside it, the overlay disappears
- UX3: When a multi-file drop contains both valid and invalid files, valid files are attached immediately and an error message lists rejected filenames
- UX4: Error message for rejected files auto-dismisses after 5 seconds (matching existing `AttachFileButton` behavior)
- UX5: The attachment button remains visible and functional alongside the drop zone — both methods coexist

## Behavior

Behavior specs will be defined in delta specs for `file-attachments` and `upload-error-messages` capabilities.

## Visual Reference

No Figma mockup — classic dashed-border overlay pattern, consistent with existing app styling (Tailwind design tokens).

## Affected IA

No IA changes — feature enhances existing attachment sections without adding new pages or navigation.

## Success Metrics

- M1: All 3 attachment sections (task, goal, idea) support file drop on desktop
- M2: Server rejects files >5 MB with appropriate error code (verified by integration tests)
- M3: Batch upload responses include `error_code` for all error cases (verified by integration tests)
- M4: Mutation testing score >=95% on new client-side validation utility

## Capabilities

### New Capabilities

- `file-drop-zone`: Desktop drag-and-drop UI for attaching files to entities, including drop zone overlay, multi-file handling, and shared validation utility

### Modified Capabilities

- `file-attachments`: ADDED server-side file size validation requirement, ADDED shared validation utility requirement
- `upload-error-messages`: ADDED `error_code` field to batch upload per-item results for machine-readable error handling

## Impact

- `packages/client/src/components/shared/` — new `FileDropZone` component, new `validateFile` utility, modified `AttachFileButton` and `EntityAttachments`
- `packages/adapter-supabase/supabase/functions/upload-file/` — add size validation
- `packages/adapter-supabase/supabase/functions/upload-files/` — add size validation + `error_code` in results
- `packages/adapter-supabase/supabase/functions/_shared/constants.ts` — add `MAX_ATTACHMENT_SIZE_BYTES`
- `packages/contract/src/schemas/api.ts` — update `UploadFileBatchResultSchema`
- `packages/integration/` — new integration tests for size validation and error codes
- `packages/client/src/locales/` — new i18n keys for drop zone text and rejected files message

## Open Questions

None — all decisions resolved during explore session.
