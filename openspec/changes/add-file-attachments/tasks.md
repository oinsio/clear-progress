## 1. Contract — types, constants, and protocol (FR1, FR2, FR3, FR4, FR5)

- [ ] 1.1 Add `ALLOWED_FILE_MIME_TYPES`, `FILE_MAGIC_BYTES`, `MAX_ATTACHMENT_SIZE_BYTES` constants to `packages/contract/src/constants.ts`
- [ ] 1.2 Add `EntityType` enum (`"task" | "goal" | "idea"`) to `packages/contract/src/domain/`
- [ ] 1.3 Add `WireAttachmentSchema` and `WireAttachment` type to `packages/contract/src/schemas/entities.ts`
- [ ] 1.4 Rename cover protocol types: `UploadCoverRequest` -> `UploadFileRequest`, `GetCoverRequest` -> `GetFileRequest`, `DeleteCoverRequest` -> `DeleteFileRequest`, etc. in `packages/contract/src/protocol/`
- [ ] 1.5 Update `SyncAdapter` interface: rename `uploadCover` -> `uploadFile`, `getCover` -> `getFile`, `deleteCover` -> `deleteFile`, `uploadCovers` -> `uploadFiles`
- [ ] 1.6 Add `attachments` field to `PullResponse` and `PushRequest` (FR6)
- [ ] 1.7 Add `attachments` to `PushResponse.results`
- [ ] 1.8 Update `DeleteFileRequest` — remove `goal_id`, use only `{ hash }` (FR7 — ref-counting is now cross-entity)
- [ ] 1.9 Update all contract exports in `packages/contract/src/index.ts`
- [ ] 1.10 Add `validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean` utility to contract
- [ ] 1.11 BDD unit tests for magic bytes validation and MIME allowlist
- [ ] 1.12 Run `pnpm run build` in contract to verify compilation

## 2. Client — IndexedDB migration and repositories (FR4, FR5)

- [ ] 2.1 Update `packages/client/src/db/schema.ts`: rename `covers` -> `files`, `pending_covers` -> `pending_files`, add `attachments` table
- [ ] 2.2 Add Dexie version upgrade migration: move data from `covers` -> `files`, `pending_covers` -> `pending_files`
- [ ] 2.3 Rename `CoverRepository` -> `FileRepository` (same API, new table name)
- [ ] 2.4 Rename `PendingCoverRepository` -> `PendingFileRepository`
- [ ] 2.5 Create `AttachmentRepository` with methods: `getByEntityTypeAndId`, `getByHash`, `save`, `delete`, `getAll`, `getAllByEntityTypeAndId` (including soft-deleted)
- [ ] 2.6 Update `packages/client/src/types/entities.ts`: rename `CoverRecord` -> `FileRecord`, `PendingCoverRecord` -> `PendingFileRecord`, add client `Attachment` type
- [ ] 2.7 BDD unit tests for AttachmentRepository
- [ ] 2.8 Run build to verify compilation

## 3. Client — services rename and file validation (FR1, FR2, FR3, FR4)

- [ ] 3.1 Rename `LocalCoverCache` -> `LocalFileCache`
- [ ] 3.2 Rename `CoverService` -> `FileService`, generalize `uploadCover` -> `uploadFile`, accept MIME allowlist + magic bytes + configurable size limit
- [ ] 3.3 Rename `CoverSyncService` -> `FileSyncService`, update all method names (initializeLocalCovers -> initializeLocalFiles, etc.)
- [ ] 3.4 Update `FileSyncService.ensureServerFilesAreCached` to consider both `goals.cover_hash` and `attachments.data_hash` (FR7)
- [ ] 3.5 Update `FileSyncService.reuploadLocalFiles` to include attachment-referenced files (FR7)
- [ ] 3.6 Update all imports across client (hooks, components, tests) to use new names
- [ ] 3.7 Update `packages/client/src/constants/index.ts`: rename cover constants, add `MAX_ATTACHMENT_SIZE_BYTES`
- [ ] 3.8 BDD unit tests for FileService validation (MIME + magic bytes + size limits)
- [ ] 3.9 Mutation testing on FileService and FileSyncService (target >= 95%)

## 4. Client — AttachmentService and sync integration (FR5, FR6, FR7, FR8, FR13, FR14, FR15, FR16)

- [ ] 4.1 Create `AttachmentService`: `attachFile(file, entityType, entityId)`, `deleteAttachment(attachmentId)`, `getAttachments(entityType, entityId)`
- [ ] 4.2 Integrate attachment operations with FileService (upload/cache file, create attachment record)
- [ ] 4.3 Update `SyncService` push logic to include attachments (chunk fill order: after checklist_items, before settings — D11)
- [ ] 4.3.1 BDD unit tests for attachment ordering in chunked push (`sync_chunked_push.feature` — @add-file-attachments @FR6)
- [ ] 4.4 Update `SyncService` pull logic to apply attachment records from server
- [ ] 4.5 Add cascading soft-delete for attachments when parent entity (task/goal/idea) is deleted
- [ ] 4.6 Add cascading restore for attachments when parent entity is restored
- [ ] 4.7 Create `useAttachments(entityType, entityId)` hook
- [ ] 4.8 Rename `useCoverUrl` -> `useFileUrl`, `useCoverPreview` -> `useFilePreview`
- [ ] 4.9 BDD unit tests for AttachmentService CRUD
- [ ] 4.10 BDD unit tests for cascading delete/restore of attachments
- [ ] 4.11 BDD unit tests for attachment sync (push/pull)
- [ ] 4.12 Mutation testing on AttachmentService (target >= 95%)

## 5. Adapter — in-memory (FR4, FR6, FR7)

- [ ] 5.1 Rename cover operations to file operations in `packages/adapter-inmemory`
- [ ] 5.2 Add `attachments` storage to in-memory adapter (push/pull support)
- [ ] 5.3 Update ref-counting to check both goals.cover_hash and attachments.data_hash
- [ ] 5.4 Update contract tests to pass with new API names

## 6. Adapter — GAS (FR4, FR6, FR7)

- [ ] 6.1 Rename server actions: `upload-cover` -> `upload-file`, `get-cover` -> `get-file`, `delete-cover` -> `delete-file`, `upload-covers` -> `upload-files`
- [ ] 6.2 Rename Drive folder from `Covers` to `Files`
- [ ] 6.3 Update MIME validation to use contract allowlist
- [ ] 6.4 Add magic bytes validation server-side
- [ ] 6.5 Add `Attachments` sheet support in GAS server
- [ ] 6.6 Update ref-counting in delete-file to scan both Goals sheet (cover_hash) and Attachments sheet (data_hash)
- [ ] 6.7 Add attachments to push/pull actions
- [ ] 6.8 Rename GAS client adapter methods to match new SyncAdapter interface
- [ ] 6.9 Update action routing (`API_ACTIONS` constants)
- [ ] 6.10 Update all GAS tests (unit + BDD)

## 7. Adapter — Supabase (FR4, FR6, FR7)

- [ ] 7.1 Update migration SQL: rename `covers` table -> `files`, add `attachments` table
- [ ] 7.2 Rename storage bucket `covers` -> `files` in deploy scripts
- [ ] 7.3 Rename edge functions: `upload-cover` -> `upload-file`, `get-cover` -> `get-file`, `delete-cover` -> `delete-file`, `upload-covers` -> `upload-files`
- [ ] 7.4 Update MIME validation in edge functions to use contract allowlist
- [ ] 7.5 Add magic bytes validation in edge functions
- [ ] 7.6 Update ref-counting SQL to consider both `goals.cover_hash` and `attachments.data_hash`
- [ ] 7.7 Add attachments to push/pull edge functions
- [ ] 7.8 Rename Supabase client adapter methods to match new SyncAdapter interface
- [ ] 7.9 Update all Supabase tests

## 8. UI — shared components (FR9, FR10, FR11, FR12, FR13, NFR-A1, NFR-R1)

- [ ] 8.1 Create `FileLightbox` component (generalize CoverLightbox): image via `<img>`, PDF via sandboxed `<iframe>`, text via `<pre>` — with focus trap and Escape-to-close
- [ ] 8.2 Create `AttachmentList` component: file type icon, filename, file size, download button (with confirmation), delete button (with confirmation), click to preview
- [ ] 8.3 Create `AttachFileButton` component: hidden file input with accept filter from allowlist, validation before upload
- [ ] 8.4 Create `ConfirmDialog` component (reusable for download and delete confirmations) — with focus trap and Escape support
- [ ] 8.5 Add i18n keys for all new UI strings (ru.json + en.json)
- [ ] 8.6 A11y: axe-core assertions for FileLightbox, AttachmentList, AttachFileButton, ConfirmDialog (NFR-A1)

## 9. UI — task detail panel integration (UX1)

- [ ] 9.1 Refactor TaskDetailPanel.tsx (802 lines) into: TaskDetailPanel (orchestrator), TaskDetailsTab, TaskChecklistTab
- [ ] 9.2 Add `TaskAttachmentsTab` component with AttachmentList + AttachFileButton
- [ ] 9.3 Add third pill button "Attachments" to tab switcher with count badge
- [ ] 9.4 Verify all existing task detail tests pass after refactoring

## 10. UI — goal detail card integration (UX2, UX3)

- [ ] 10.1 Restructure `GoalCardEditMode`: cover + name always visible at top, Details/Attachments tabs, footer buttons always at bottom
- [ ] 10.2 Add `GoalAttachmentsTab` component with AttachmentList + AttachFileButton
- [ ] 10.3 Unify description chevron and attachments into single collapsible details section in `GoalCardViewMode`: one chevron controls both description expansion and attachment list visibility. Chevron appears when description overflows OR goal has attachments.
- [ ] 10.4 Update existing goal card tests

## 11. UI — idea detail panel integration (UX4)

- [ ] 11.1 Add attachments section to `IdeaDetailPanel` below description
- [ ] 11.2 Update existing idea panel tests

## 12. Contract tests (FR4, FR6, FR7)

- [ ] 12.1 Update `packages/contract/tests/contracts/sync-adapter.contract.ts`: rename cover tests to file tests
- [ ] 12.2 Add contract tests for attachment push/pull
- [ ] 12.3 Add contract tests for file delete with cross-entity ref-counting
- [ ] 12.4 Verify contract tests pass against in-memory adapter

## 13. Integration tests

- [ ] 13.1 Update existing cover sync integration tests to use new file API names (`packages/integration/src/tests/covers-sync.spec.ts`)
- [ ] 13.2 Add integration test: file upload -> pull on second device -> file available
- [ ] 13.3 Add integration test: attachment create -> sync -> attachment appears on second device
- [ ] 13.4 Add integration test: attachment soft-delete -> sync -> deleted on second device
- [ ] 13.5 Add integration test: ref-counting — two attachments same hash -> delete one -> file stays -> delete second -> file removed
- [ ] 13.6 Add integration test: cover + attachment same hash -> ref-counting correct
- [ ] 13.7 Add integration test: offline attachment creation -> pending file -> sync on reconnect -> file on server

## 14. Final verification

- [ ] 14.1 Run `pnpm run lint:fix` — all should pass
- [ ] 14.2 Run `pnpm run preflight` — all should pass
- [ ] 14.3 Run `pnpm run build` — verify no type errors
- [ ] 14.4 Mutation testing on new client code (FileService, AttachmentService, FileSyncService) — target >= 95%
- [ ] 14.5 Verify no cover regression: existing goal cover functionality works after rename
- [ ] 14.6 Verify i18n completeness: all new keys present in both ru.json and en.json
