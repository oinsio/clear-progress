## 1. Shared file validation utility

- [x] 1.1 Create `src/utils/validateFile.ts` — extract validation pipeline (magic bytes → MIME allowlist → size check) from `AttachFileButton.handleFileChange` into a pure function. Returns `{ valid: true, file: File }` or `{ valid: false, filename: string, errorKey: string }`. TDD: write tests first. Implements FR4, FR5
- [x] 1.2 Refactor `AttachFileButton` to use `validateFile` instead of inline validation logic. Run existing `AttachFileButton.test.tsx` — all tests pass. Implements FR5
- [x] 1.3 Mutation testing on `validateFile.ts` — run `npx stryker run --mutate 'src/utils/validateFile.ts'`, target >=95%. Implements M4

## 2. FileDropZone component

- [x] 2.1 Create `src/components/shared/FileDropZone.tsx` — container component with native `dragover`/`dragleave`/`drop` handlers. Shows dashed-border overlay on file drag (only when `dataTransfer.types` includes `"Files"`). Hidden on touch devices via `pointer-fine:` Tailwind variant. TDD: write tests first. Implements FR1, FR2, FR8, NFR-A1, NFR-R1
- [x] 2.2 Add multi-file drop handling — iterate `dataTransfer.files`, validate each with `validateFile`, call `onFilesAccepted` with valid files, show rejected filenames in `role="alert"` error that auto-dismisses after 5 seconds. TDD. Implements FR3, FR6, FR7, UX1-UX4
- [x] 2.3 Add i18n keys for drop zone text and rejection message to `ru.json`, `en.json`, `house.json`. Implements FR7

## 3. Integration into EntityAttachments

- [x] 3.1 Wrap `EntityAttachments` content with `FileDropZone`. Pass `handleFileSelected` for sequential attachment of accepted files. Run existing `EntityAttachments` and tab/section tests — all pass. Implements UX5, M1
- [x] 3.2 Mutation testing on `FileDropZone.tsx` — run `npx stryker run --mutate 'src/components/shared/FileDropZone.tsx'`, target >=95%

## 4. Server-side file size validation

- [x] 4.1 Add `MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024` to `_shared/constants.ts` with source reference comment. Implements FR12
- [x] 4.2 Add size check in `upload-file/index.ts` after base64 decode — return `errorResponse(ErrorCode.FILE_TOO_LARGE, ...)` if `fileBytes.length > MAX_ATTACHMENT_SIZE_BYTES`. Implements FR9, FR11
- [x] 4.3 Add size check in `upload-files/index.ts` (`processSingleFile`) after base64 decode — return per-item `{ ok: false, error_code: "FILE_TOO_LARGE", error: "..." }`. Implements FR10, FR11

## 5. Batch upload response schema unification

- [x] 5.1 Add `ok: z.boolean()` field to `UploadFileBatchResultSchema` in `packages/contract/src/schemas/api.ts`. Implements FR13
- [x] 5.2 Add `error_code: z.string().optional()` field to `UploadFileBatchResultSchema`. Implements FR14
- [x] 5.3 Update `processSingleFile` in `upload-files/index.ts` to return `ok` and `error_code` for all result paths (success and all error branches). Implements FR15
- [x] 5.4 Update `in-memory-sync-adapter.ts` to return `ok` and `error_code` fields in batch results (match contract schema)
- [x] 5.5 Run contract tests (`packages/contract`) — verify schema validation passes with new fields
- [x] 5.6 Run adapter-supabase tests (`packages/adapter-supabase`) — verify adapter returns updated fields

## 6. Integration tests

- [x] 6.1 Integration test: upload file >5 MB via `upload-file` — verify `FILE_TOO_LARGE` error response. Implements M2
- [x] 6.2 Integration test: upload batch with one oversized file via `upload-files` — verify per-item `error_code: "FILE_TOO_LARGE"` and other files succeed. Implements M2, M3
- [x] 6.3 Integration test: upload batch with invalid MIME — verify per-item `error_code: "INVALID_FILE_CONTENT"`. Implements M3

## 7. Build verification

- [x] 7.1 Run `pnpm run build` — verify no type errors across all packages
- [x] 7.2 Run full unit test suite `pnpm run test` — verify no regressions
