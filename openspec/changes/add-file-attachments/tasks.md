## 1. Contract — types, constants, and protocol (FR1, FR2, FR3, FR4, FR5)

- [x] 1.1 Add `ALLOWED_FILE_MIME_TYPES`, `FILE_MAGIC_BYTES`, `MAX_ATTACHMENT_SIZE_BYTES` constants to `packages/contract/src/constants.ts`
- [x] 1.2 Add `EntityType` enum (`"task" | "goal" | "idea"`) to `packages/contract/src/domain/`
- [x] 1.3 Add `WireAttachmentSchema` and `WireAttachment` type to `packages/contract/src/schemas/entities.ts`
- [x] 1.4 Rename cover protocol types: `UploadCoverRequest` -> `UploadFileRequest`, `GetCoverRequest` -> `GetFileRequest`, `DeleteCoverRequest` -> `DeleteFileRequest`, etc. in `packages/contract/src/protocol/`
- [x] 1.5 Update `SyncAdapter` interface: rename `uploadCover` -> `uploadFile`, `getCover` -> `getFile`, `deleteCover` -> `deleteFile`, `uploadCovers` -> `uploadFiles`
- [x] 1.6 Add `attachments` field to `PullResponse` and `PushRequest` (FR6)
- [x] 1.7 Add `attachments` to `PushResponse.results`
- [x] 1.8 Update `DeleteFileRequest` — remove `goal_id`, use only `{ hash }` (FR7 — ref-counting is now cross-entity)
- [x] 1.9 Update all contract exports in `packages/contract/src/index.ts`
- [x] 1.10 Add `validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean` utility to contract
- [x] 1.11 BDD unit tests for magic bytes validation and MIME allowlist
- [x] 1.12 Run `pnpm run build` in contract to verify compilation

## 2. Client — IndexedDB migration and repositories (FR4, FR5)

- [x] 2.1 Update `packages/client/src/db/schema.ts`: rename `covers` -> `files`, `pending_covers` -> `pending_files`, add `attachments` table
- [x] 2.2 Add Dexie version upgrade migration: move data from `covers` -> `files`, `pending_covers` -> `pending_files`
- [x] 2.3 Rename `CoverRepository` -> `FileRepository` (same API, new table name)
- [x] 2.4 Rename `PendingCoverRepository` -> `PendingFileRepository`
- [x] 2.5 Create `AttachmentRepository` with methods: `getByEntityTypeAndId`, `getByHash`, `save`, `delete`, `getAll`, `getAllByEntityTypeAndId` (including soft-deleted)
- [x] 2.6 Update `packages/client/src/types/entities.ts`: rename `CoverRecord` -> `FileRecord`, `PendingCoverRecord` -> `PendingFileRecord`, add client `Attachment` type
- [x] 2.7 BDD unit tests for AttachmentRepository
- [x] 2.8 Run build to verify compilation

## 3. Client — services rename and file validation (FR1, FR2, FR3, FR4)

- [x] 3.1 Rename `LocalCoverCache` -> `LocalFileCache`
- [x] 3.2 Rename `CoverService` -> `FileService`, generalize `uploadCover` -> `uploadFile`, accept MIME allowlist + magic bytes + configurable size limit
- [x] 3.3 Rename `CoverSyncService` -> `FileSyncService`, update all method names (initializeLocalCovers -> initializeLocalFiles, etc.)
- [x] 3.4 Update `FileSyncService.ensureServerFilesAreCached` to consider both `goals.cover_hash` and `attachments.data_hash` (FR7)
- [x] 3.5 Update `FileSyncService.reuploadLocalFiles` to include attachment-referenced files (FR7)
- [x] 3.6 Update all imports across client (hooks, components, tests) to use new names
- [x] 3.7 Update `packages/client/src/constants/index.ts`: rename cover constants, add `MAX_ATTACHMENT_SIZE_BYTES`
- [x] 3.8 BDD unit tests for FileService validation (MIME + magic bytes + size limits)
- [x] 3.9 Mutation testing on FileService and FileSyncService (target >= 95%)

## 4. Client — AttachmentService and sync integration (FR5, FR6, FR7, FR8, FR13, FR14, FR15, FR16)

- [x] 4.1 Create `AttachmentService`: `attachFile(file, entityType, entityId)`, `deleteAttachment(attachmentId)`, `getAttachments(entityType, entityId)`
- [x] 4.2 Integrate attachment operations with FileService (upload/cache file, create attachment record)
- [x] 4.3 Update `SyncService` push logic to include attachments (chunk fill order: after checklist_items, before settings — D11)
- [x] 4.3.1 BDD unit tests for attachment ordering in chunked push (`sync_chunked_push.feature` — @add-file-attachments @FR6)
- [x] 4.4 Update `SyncService` pull logic to apply attachment records from server
- [x] 4.5 Add cascading soft-delete for attachments when parent entity (task/goal/idea) is deleted
- [x] 4.6 Add cascading restore for attachments when parent entity is restored
- [x] 4.7 Create `useAttachments(entityType, entityId)` hook
- [x] 4.8 Rename `useCoverUrl` -> `useFileUrl`, `useCoverPreview` -> `useFilePreview`
- [x] 4.9 BDD unit tests for AttachmentService CRUD
- [x] 4.10 BDD unit tests for cascading delete/restore of attachments
- [x] 4.11 BDD unit tests for attachment sync (push/pull)
- [x] 4.12 Mutation testing on AttachmentService (target >= 95%)

## 5. Adapter — in-memory (FR4, FR6, FR7)

- [x] 5.1 Rename cover operations to file operations in `packages/adapter-inmemory`
- [x] 5.2 Add `attachments` storage to in-memory adapter (push/pull support)
- [x] 5.3 Update ref-counting to check both goals.cover_hash and attachments.data_hash
- [x] 5.4 Update contract tests to pass with new API names

## 6. Adapter — GAS (FR4, FR6, FR7)

- [x] 6.1 Rename server actions: `upload-cover` -> `upload-file`, `get-cover` -> `get-file`, `delete-cover` -> `delete-file`, `upload-covers` -> `upload-files`
- [x] 6.2 Rename Drive folder from `Covers` to `Files`
- [x] 6.3 Update MIME validation to use contract allowlist
- [x] 6.4 Add magic bytes validation server-side
- [x] 6.5 Add `Attachments` sheet support in GAS server
- [x] 6.6 Update ref-counting in delete-file to scan both Goals sheet (cover_hash) and Attachments sheet (data_hash)
- [x] 6.7 Add attachments to push/pull actions
- [x] 6.8 Rename GAS client adapter methods to match new SyncAdapter interface
- [x] 6.9 Update action routing (`API_ACTIONS` constants)
- [x] 6.10 Update all GAS tests (unit + BDD)

## 7. Adapter — Supabase (FR4, FR6, FR7)

- [x] 7.1 Update migration SQL: rename `covers` table -> `files`, add `attachments` table
- [x] 7.2 Rename storage bucket `covers` -> `files` in deploy scripts
- [x] 7.3 Rename edge functions: `upload-cover` -> `upload-file`, `get-cover` -> `get-file`, `delete-cover` -> `delete-file`, `upload-covers` -> `upload-files`
- [x] 7.4 Update MIME validation in edge functions to use contract allowlist
- [x] 7.5 Add magic bytes validation in edge functions
- [x] 7.6 Update ref-counting SQL to consider both `goals.cover_hash` and `attachments.data_hash`
- [x] 7.7 Add attachments to push/pull edge functions
- [x] 7.8 Rename Supabase client adapter methods to match new SyncAdapter interface
- [x] 7.9 Update all Supabase tests

## 8. UI — shared components (FR9, FR10, FR11, FR12, FR13, NFR-A1, NFR-R1)

- [x] 8.1 Create `FileLightbox` component (generalize CoverLightbox): image via `<img>`, PDF via sandboxed `<iframe>`, text via `<pre>` — with focus trap and Escape-to-close
- [x] 8.2 Create `AttachmentList` component: file type icon, filename, file size, download button (with confirmation), delete button (with confirmation), click to preview
- [x] 8.3 Create `AttachFileButton` component: hidden file input with accept filter from allowlist, validation before upload
- [x] 8.4 Create `ConfirmDialog` component (reusable for download and delete confirmations) — with focus trap and Escape support
- [x] 8.5 Add i18n keys for all new UI strings (ru.json + en.json)
- [x] 8.6 A11y: axe-core assertions for FileLightbox, AttachmentList, AttachFileButton, ConfirmDialog (NFR-A1)

## 9. UI — task detail panel integration (UX1)

- [x] 9.1 Refactor TaskDetailPanel.tsx (802 lines) into: TaskDetailPanel (orchestrator), TaskDetailsTab, TaskChecklistTab
- [x] 9.2 Add `TaskAttachmentsTab` component with AttachmentList + AttachFileButton
- [x] 9.3 Add third pill button "Attachments" to tab switcher with count badge
- [x] 9.4 Verify all existing task detail tests pass after refactoring

## 10. UI — goal detail card integration (UX2, UX3)

- [x] 10.1 Restructure `GoalCardEditMode`: cover + name always visible at top, Details/Attachments tabs, footer buttons always at bottom
- [x] 10.2 Add `GoalAttachmentsTab` component with AttachmentList + AttachFileButton
- [x] 10.3 Unify description chevron and attachments into single collapsible details section in `GoalCardViewMode`: one chevron controls both description expansion and attachment list visibility. Chevron appears when description overflows OR goal has attachments.
- [x] 10.4 Update existing goal card tests

## 11. UI — idea detail panel integration (UX4)

- [x] 11.1 Add attachments section to `IdeaDetailPanel` below description
- [x] 11.2 Update existing idea panel tests

## 12. Contract tests (FR4, FR6, FR7)

- [x] 12.1 Update `packages/contract/tests/contracts/sync-adapter.contract.ts`: rename cover tests to file tests
- [x] 12.2 Add contract tests for attachment push/pull
- [x] 12.3 Add contract tests for file delete with cross-entity ref-counting
- [x] 12.4 Verify contract tests pass against in-memory adapter

## 13. Integration tests

- [x] 13.1 Update existing cover sync integration tests to use new file API names (`packages/integration/src/tests/covers-sync.spec.ts`)
- [x] 13.2 Add integration test: file upload -> pull on second device -> file available (covered by existing covers-sync and multi-device-sync tests)
- [x] 13.3 Add integration test: attachment create -> sync -> attachment appears on second device
- [x] 13.4 Add integration test: attachment soft-delete -> sync -> deleted on second device
- [x] 13.5 Add integration test: ref-counting — two attachments same hash -> delete one -> file stays -> delete second -> file removed
- [x] 13.6 Add integration test: cover + attachment same hash -> ref-counting correct
- [x] 13.7 Add integration test: offline attachment creation -> pending file -> sync on reconnect -> file on server

## 14. Dynamic ref-counting and purge file cleanup (FR7, FR17, FR18)

- [x] 14.1 Supabase: update `delete-file` edge function — replace stored `ref_count` decrement with dynamic reference counting (query `goals.cover_hash` + `attachments.data_hash` including soft-deleted records)
- [x] 14.2 Supabase: update `purge` edge function — after hard-deleting `is_deleted=true` records, find orphaned files (no references in `goals.cover_hash` or `attachments.data_hash`) and delete them from Storage + `files` table
- [x] 14.3 Supabase: remove `ref_count` column from `files` table (migration)
- [x] 14.4 Supabase: update `upload-file` and `upload-files` edge functions — remove `ref_count` increment logic (dedup by hash only, no counter)
- [x] 14.5 GAS: update `delete-file` action — extend dynamic counting to include Attachments `data_hash` (GAS already uses dynamic counting for covers via Goals sheet)
- [x] 14.6 GAS: update `purge` action — add orphaned file cleanup after hard-deleting records
- [x] 14.7 Client: add `deleteFile` call to `AttachmentService.deleteAttachment` after soft-delete (FR18)
- [x] 14.8 In-memory adapter: update `deleteFile` to use dynamic ref-counting; update `purge` to clean up orphaned files
- [x] 14.9 Contract tests: update `deleteFile` contract tests for idempotent dynamic counting behavior
- [x] 14.10 Contract tests: add contract tests for purge with file cleanup
- [x] 14.11 Integration tests: update ref-counting tests (13.5, 13.6) — soft-delete + deleteFile keeps file (soft-deleted record counts), purge removes file
- [x] 14.12 Integration test: two devices remove same cover from same goal, second goal still references file — file stays (idempotent)
- [x] 14.13 Integration test: soft-delete attachment, deleteFile called, file stays — purge hard-deletes, file removed
- [x] 14.14 Integration test: cover removed from goal (goal not deleted, cover_hash=""), no other refs — deleteFile removes file immediately
- [x] 14.15 Integration test: two attachments same hash, soft-delete both, deleteFile keeps file — purge removes
- [x] 14.16 Integration test: cover + attachment same hash, remove cover, deleteFile returns ref_count=1 — file stays

## 15. Full sync UI rename covers → files (FR4)

- [x] 15.1 Update `FullSyncStep` type: `reupload_covers` → `reupload_files`, `upload_covers` → `upload_files`, `download_covers` → `download_files`
- [x] 15.2 Update `SyncProvider.tsx` `triggerFullSync`: step names and progress callbacks
- [x] 15.3 Update `ConfirmFullSyncDialog.tsx`: `PROGRESS_STEPS` keys, labelKeys, testIds
- [x] 15.4 Update i18n keys in `en.json`, `ru.json`, `house.json`: `fullSyncStepReuploadCovers` → `fullSyncStepReuploadFiles`, etc.
- [x] 15.5 Update tests referencing old step names/testIds

## 16. PDF viewer — replace iframe with react-pdf (FR10)

- [x] 16.1 Install `react-pdf` and `pdfjs-dist` dependencies in `packages/client`
- [x] 16.2 Configure pdf.js worker for Vite (lazy-loaded via `new URL` pattern)
- [x] 16.3 Replace iframe PDF rendering in `FileLightbox.tsx` with react-pdf `Document` + `Page` components (canvas-based)
- [x] 16.4 Update `FileLightbox.test.tsx` — replace iframe assertions with canvas/react-pdf assertions
- [x] 16.5 Run `pnpm run build` to verify compilation
- [x] 16.6 Manual smoke test: open PDF attachment in lightbox, verify rendering

## 17. Markdown rendering in FileLightbox (FR11, D13)

- [ ] 17.1 Install `react-markdown`, `remark-gfm`, and `@tailwindcss/typography` in `packages/client`
- [ ] 17.2 Create `MarkdownPreview` component in `packages/client/src/components/shared/MarkdownPreview.tsx` — fetch text content, render via `react-markdown` + `remark-gfm`, style with Tailwind `prose`
- [ ] 17.3 Update `FilePreview` in `FileLightbox.tsx` — add `text/markdown` branch before `text/*`, route to `MarkdownPreview`
- [ ] 17.4 Add unit tests for `MarkdownPreview` (loading, error, renders formatted markdown)
- [ ] 17.5 Verify build (`pnpm run build`) and existing FileLightbox tests pass

## 18. Final verification

- [ ] 18.1 Mutation testing on new client code (FileService, AttachmentService, FileSyncService) — target >= 95%
- [x] 18.2 Verify no cover regression: existing goal cover functionality works after rename
- [x] 18.3 Verify i18n completeness: all new keys present in both ru.json and en.json
- [x] 18.4 Run `pnpm run lint:fix` — all should pass
- [x] 18.5 Run `pnpm run preflight` — all should pass (5 pre-existing failures unrelated to this change: 1 TaskService recurring test + 4 e2e browser tests)
- [x] 18.6 Run `pnpm run build` — verify no type errors
- [x] 18.7 Run skill `/uncommitted-files` to save list of changed and added files
- [x] 18.8 Run skill `/fix-uncommitted` to fix IDE highlighted issues (fixed GAS purge tests: added files count to expected response)
- [x] 18.9 Run `pnpm run lint:fix` — all should pass (final checks)
- [x] 18.10 Run `pnpm run preflight` — all should pass (final checks)
- [x] 18.11 Run `pnpm run build` — verify no type errors (final checks)
