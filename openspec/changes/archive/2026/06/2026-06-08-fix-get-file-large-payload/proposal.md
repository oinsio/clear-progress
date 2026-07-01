# fix-get-file-large-payload

## Why

Edge Function `get-file` crashes with 500 Internal Server Error when downloading files larger than ~64 KB. The function uses `String.fromCharCode(...bytes)` with the spread operator on the entire `Uint8Array`, which exceeds the JavaScript call stack limit for large arrays. This makes file attachments and covers unusable on any device that didn't originally upload the file — the core multi-device sync scenario is broken for real-world file sizes.

## What Changes

- **MODIFIED**: `get-file` Edge Function — replace single-shot `String.fromCharCode(...bytes)` with chunked base64 encoding (same pattern already used in client-side `arrayBufferToBase64`)
- **ADDED**: Integration test with a realistic file size (>64 KB) to prevent regression

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `supabase-edge-functions`: Fix base64 encoding in `get-file` to handle files of any allowed size (up to 5 MB)

## Goals

- G1: Files attached on Device A are downloadable and previewable on Device B

## Non-Goals

- NG1: Changing the file size limits or allowed MIME types
- NG2: Changing the base64 transport format (e.g., switching to streaming)

## Users & Scenarios

- U1: User attaches a photo (500 KB) to a task on their phone, syncs, opens the task on their laptop — the photo should be viewable and downloadable

## Requirements

### Functional

- FR1: `get-file` Edge Function must successfully return base64-encoded file data for files up to 5 MB (MAX_ATTACHMENT_SIZE_BYTES)
- FR2: Chunked encoding must produce identical output to the current implementation for small files (backward compatible)

### Non-Functional

#### Performance

- NFR-P1: No measurable latency regression for files under 1 MB

## UX Acceptance Criteria

- UX1: Download button on Device B is enabled (not grayed out) after sync completes
- UX2: Preview (lightbox) opens and displays the file content on Device B

## Behavior

Reference: existing `features/file_attachments/*.feature` — no new feature files needed

## Visual Reference

No visual changes.

## Affected IA

No changes.

## Success Metrics

- M1: `get-file` returns 200 for files up to 5 MB (currently fails at ~64 KB)
- M2: Integration test with >64 KB file passes on both local Docker and production

## Open Questions

_None_
