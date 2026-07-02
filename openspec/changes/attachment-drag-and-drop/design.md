## Context

The app supports file attachments for tasks, goals, and ideas through `AttachFileButton` — a click-to-browse component. Desktop users cannot drag files from the OS into the app. Server-side upload functions (`upload-file`, `upload-files`) validate MIME types and magic bytes but do not enforce file size limits — `MAX_ATTACHMENT_SIZE_BYTES` is defined but unused. The batch upload response uses free-form `error` strings without machine-readable codes.

Driven by FR1-FR15 of attachment-drag-and-drop proposal.

## Goals / Non-Goals

**Goals:**
- Add native browser file drop to attachment sections (FR1-FR8)
- Enforce server-side file size limits (FR9-FR12)
- Add `error_code` to batch upload per-item results (FR13-FR15)

**Non-Goals:**
- Touch/mobile drag-and-drop (NG1)
- Separate cover vs attachment size limits on server (NG2)
- Global page-level drop zones (NG4)

## Decisions

### D1: Native browser drag-and-drop API (not @dnd-kit)

Use native `dragover`/`dragleave`/`drop` events, not `@dnd-kit`. The existing `@dnd-kit` setup handles element reordering within lists — file drops from the OS are a fundamentally different interaction that `@dnd-kit` does not support. Native API detects file drags via `e.dataTransfer.types.includes("Files")`, avoiding any conflict with `@dnd-kit`'s pointer/touch sensors.

**Alternatives considered:**
- `@dnd-kit` with custom sensors — rejected: not designed for external file drops, would require fighting the framework
- `react-dropzone` library — rejected: adds dependency for a simple feature that native API handles well

### D2: Shared `validateFile` utility extracted from `AttachFileButton`

Extract the validation pipeline (magic bytes → MIME allowlist → size check) from `AttachFileButton.handleFileChange` into `src/utils/validateFile.ts`. Both `AttachFileButton` and `FileDropZone` call this function. Returns `{ valid: true, file: File }` or `{ valid: false, filename: string, errorKey: string }`.

**Rationale:** DRY — validation logic currently lives inside a React event handler and cannot be reused. The utility is pure (no React dependencies), easily testable, and follows the existing pattern of `src/utils/` for business logic helpers.

### D3: `FileDropZone` wraps `EntityAttachments` content

`FileDropZone` is a container component that wraps the attachment section content. It renders its `children` normally, and overlays a dashed-border drop indicator when files are dragged over. Integrated into `EntityAttachments` directly — no changes needed in `TaskAttachmentsTab`, `GoalAttachmentsTab`, or `IdeaAttachmentsSection`.

### D4: Sequential attachment for multi-file drops

When multiple files are dropped, attach them sequentially (not in parallel). Each `attachFile` call computes SHA-256, checks dedup, uploads, and assigns `sort_order`. Sequential processing ensures correct ordering and avoids race conditions in `sort_order` assignment.

### D5: Touch detection via CSS `@media (pointer: fine)`

Hide `FileDropZone` on touch-only devices using Tailwind's `pointer-fine:` variant (maps to `@media (pointer: fine)`). This is more reliable than JS-based touch detection and avoids hydration mismatches.

### D6: Server-side size check placement

File size validation occurs immediately after base64 decode, before database lookup or storage upload. This is the earliest point where actual byte size is known and avoids wasting I/O on files that will be rejected.

### D7: Backward-compatible schema extension for batch results

Add `ok` and `error_code` as new optional fields to `UploadFileBatchResultSchema`. Existing clients that don't read these fields continue working. The `error` field remains for human-readable messages. `error_code` values match the `ErrorCode` enum already defined in `_shared/constants.ts`.

## Risks / Trade-offs

- [Duplicate constants in Deno] `MAX_ATTACHMENT_SIZE_BYTES` must be duplicated in `_shared/constants.ts` because Deno edge functions cannot import from `@clear-progress/contract`. → Mitigated by comment referencing source, same pattern used for `ALLOWED_FILE_MIME_TYPES`.
- [Multi-file error UX] Showing rejected filenames after valid files are attached may be confusing if list updates and error message appear simultaneously. → Mitigated by auto-dismiss after 5 seconds (matching existing pattern) and error appearing below the attachment list.
- [Large multi-file drops] Dropping 10+ files triggers sequential uploads which may take noticeable time. → Acceptable for MVP; no loading indicator planned beyond existing sync status.
