## 1. Contract: detectMimeType function (FR1)

- [ ] 1.1 TDD: Write tests for `detectMimeType(buffer)` — all scenarios from mime-detection spec (JPEG, PNG, WebP, GIF, PDF, RIFF non-WebP, unknown, empty, short buffer)
- [ ] 1.2 Implement `detectMimeType` in `packages/contract/src/validation/detectMimeType.ts` — iterate `FILE_MAGIC_BYTES` with extended WebP check (D6)
- [ ] 1.3 Update `FILE_MAGIC_BYTES` for WebP: change signature to check bytes 0-3 (`RIFF`) + bytes 8-11 (`WEBP`) — design decision D6
- [ ] 1.4 Export `detectMimeType` from `packages/contract/src/index.ts`
- [ ] 1.5 Mutation testing on `detectMimeType` — target >= 95%

## 2. Client: FileService — use detected MIME type (FR2, FR4, FR5)

- [ ] 2.1 Add `UNRECOGNIZED_FORMAT` to `FILE_ERROR` constants in `FileService.ts`
- [ ] 2.2 TDD: Write tests for new `uploadFile` flow — WebP-as-PNG accepted, unknown binary rejected with `UNRECOGNIZED_FORMAT`, text fallback to browser type
- [ ] 2.3 Refactor `FileService.uploadFile()`: read buffer first, call `detectMimeType`, apply text fallback (D2), use detected type for MIME check, upload payload, and blob creation
- [ ] 2.4 Update existing `FileService.uploadFile` tests that rely on old validation flow
- [ ] 2.5 Mutation testing on modified `FileService` — target >= 95%

## 3. Client: AttachFileButton — content-based validation (FR7)

- [ ] 3.1 TDD: Write tests for `AttachFileButton` with mismatched file extension/content, unrecognized format
- [ ] 3.2 Refactor `AttachFileButton.handleFileChange` to read file buffer, call `detectMimeType`, validate detected type against allowlist
- [ ] 3.3 Update existing `AttachFileButton` tests for new validation flow

## 4. Client: Error messages in UI (FR6, NFR-A1)

- [ ] 4.1 Add i18n keys for specific errors to `ru.json`, `en.json`, `house.json`: `goal.cover.errorType`, `goal.cover.errorUnrecognized`, `goal.cover.errorSize`, `goal.cover.errorNetwork`, `attachment.attach.errorUnrecognized`
- [ ] 4.2 TDD: Write tests for error mapping in `useGoalEditForm` — each error code maps to distinct i18n key
- [ ] 4.3 Refactor `useGoalEditForm.handleSave` catch block: parse `error.message` and map to specific i18n keys
- [ ] 4.4 TDD: Write test verifying `role="alert"` on cover error message element (NFR-A1) — add attribute if missing
- [ ] 4.5 TDD: Write test verifying `AttachFileButton` error for `UNRECOGNIZED_FORMAT` uses `role="alert"` (NFR-A1)

## 5. Server: Edge Functions — detect MIME from content (FR8)

- [ ] 5.1 Duplicate `detectMimeType` into `packages/adapter-supabase/supabase/functions/_shared/detectMimeType.ts` (D5)
- [ ] 5.2 Update `upload-file/index.ts`: after decoding base64, call `detectMimeType` on bytes, use detected type instead of `body.mime_type`
- [ ] 5.3 Update `upload-files/index.ts`: same change for batch upload
- [ ] 5.4 Update `_shared/constants.ts`: extend WebP `FILE_MAGIC_BYTES` with offset 8 check (aligned with contract)

## 6. Fixture & Integration tests (M1)

- [ ] 6.1 Move `screenshots/jugru.png` to `packages/integration/src/fixtures/jugru.png` (WebP disguised as PNG — the original reproduction file)
- [ ] 6.2 Integration test: upload `jugru.png` as goal cover — create goal, set cover via file input, sync, verify `cover_hash` on server and file retrievable with `mime_type: "image/webp"`
- [ ] 6.3 Integration test: attach `jugru.png` as file attachment to a task — attach via AttachFileButton, sync, verify attachment record on server has `mime_type: "image/webp"` and file is retrievable

## 7. BDD & Build verification

- [ ] 7.1 BDD unit tests: write Gherkin feature `file_mime_detection.feature` with `@fix-file-mime-detection` tags covering key scenarios from specs
- [ ] 7.2 Build verification: `pnpm run build` passes across all packages
