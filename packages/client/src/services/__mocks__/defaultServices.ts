import {
  mockFileEnsureServerFiles,
  mockFileReuploadLocalFiles,
  mockFileSync,
  mockInit,
  mockInitializeLocalFiles,
  mockPing,
} from "@/app/providers/SyncProvider.test-mocks";

export const defaultSyncAdapter = { ping: mockPing, init: mockInit };

export const defaultFileSyncService = {
  initializeLocalFiles: mockInitializeLocalFiles,
  sync: mockFileSync,
  reuploadLocalFiles: mockFileReuploadLocalFiles,
  ensureServerFilesAreCached: mockFileEnsureServerFiles,
};
