## Context

Currently, file upload validation trusts the browser-reported `file.type` (derived from file extension) and then checks magic bytes against that declared type. When a file has a wrong extension (e.g., WebP saved as `.png`), `file.type` reports `image/png` but magic bytes are WebP — validation fails with `INVALID_MAGIC_BYTES`.

The error is caught generically in `useGoalEditForm` (line 112) and shown as "Failed to upload cover. Please try again." — no indication of what went wrong.

Driven by FR1, FR2, FR5, FR6 from proposal.

## Goals / Non-Goals

**Goals:**
- Invert the magic-bytes logic: detect real type from content, then check if it's allowed
- Propagate typed errors to UI with specific messages
- Keep server-side validation aligned with client

**Non-Goals:**
- Changing the allowed MIME type list
- Adding new magic byte signatures beyond current set
- Changing file size limits

## Decisions

### D1: Invert `validateMagicBytes` → `detectMimeType`

**Decision**: Add a new `detectMimeType(buffer): string | null` function alongside existing `validateMagicBytes`. The new function iterates `FILE_MAGIC_BYTES` entries and returns the first matching MIME type, or `null` if no match.

**Why not modify `validateMagicBytes`?** It's used in server-side code (duplicated in `adapter-supabase/_shared/files.ts`) and has extensive tests. Adding a new function is safer and doesn't break the existing contract. `validateMagicBytes` can be deprecated later.

**Alternatives considered:**
- Modify `validateMagicBytes` to return detected type — higher risk, breaks existing API
- Use a third-party library (e.g., `file-type`) — adds dependency, overkill for 5 signatures

### D2: Text file detection strategy

**Decision**: For text files (no magic bytes), `detectMimeType` returns `null`. The caller falls back to browser-reported `file.type` only for text MIME types (`text/plain`, `text/markdown`), then validates with existing null-byte check.

**Why**: Text files have no reliable magic bytes. The browser-reported type is acceptable here because text files can't be "disguised" binaries — the null-byte check catches that.

### D3: Error propagation pattern

**Decision**: `FileService.uploadFile()` already throws typed string errors (`INVALID_TYPE`, `FILE_TOO_LARGE`, `INVALID_MAGIC_BYTES`). We add `UNRECOGNIZED_FORMAT` and replace `INVALID_MAGIC_BYTES` usage (it becomes unreachable with the new flow). Callers parse `error.message` against known codes.

**Why not custom Error subclasses?** The existing pattern uses string codes and works well. No need to over-engineer.

### D4: Error display in cover upload

**Decision**: Move error handling from generic catch in `useGoalEditForm` to a helper that maps error codes to i18n keys. Reuse the same pattern `AttachFileButton` already has (inline error with timeout).

**Flow after change:**
```
FileService.uploadFile()
  → detectMimeType(buffer)
    → null + not text → throw UNRECOGNIZED_FORMAT
    → detected type not in allowlist → throw INVALID_TYPE
    → size check → throw FILE_TOO_LARGE
    → upload (network error) → save to pending, no throw
  → useGoalEditForm catches → maps code to i18n key → shows message
```

### D5: Server-side alignment

**Decision**: Duplicate `detectMimeType` in `adapter-supabase/supabase/functions/_shared/` (same as current `validateMagicBytes` duplication). Server uses detected type for storage path extension and file record.

**Why duplicate?** Deno Edge Functions cannot import from `@clear-progress/contract`. This is the established pattern (see existing `ALLOWED_FILE_MIME_TYPES` and `FILE_MAGIC_BYTES` duplication).

### D6: WebP magic bytes disambiguation

**Decision**: WebP files start with `RIFF` header (bytes `52 49 46 46`), which is shared with other RIFF-based formats (WAV, AVI). To avoid false positives, check for `WEBP` at offset 8 in addition to the `RIFF` header.

**Current state**: `FILE_MAGIC_BYTES` only checks `RIFF` prefix. This is sufficient for validation (we know the declared type), but insufficient for detection (multiple formats share `RIFF`).

## Risks / Trade-offs

- **[Risk] RIFF-based format collision** — A WAV file could be detected as WebP if we only check `RIFF`. Mitigation: check bytes 8-11 for `WEBP` string (D6).
- **[Risk] Server/client MIME type mismatch during transition** — Old clients send browser-reported MIME, new server detects from content. Mitigation: server always uses detected type, ignoring client-declared `mime_type`. This is backward-compatible since the file content hasn't changed.
- **[Risk] Text file false negatives** — `detectMimeType` returns `null` for text. Mitigation: explicit fallback path for text MIME types, maintaining existing behavior.

## Open Questions

- Q1 (from proposal): Text file fallback — resolved in D2 (fall back to browser type for text only).
- Q2 (from proposal): Server behavior on mismatch — resolved in D5 (silently use detected type).
