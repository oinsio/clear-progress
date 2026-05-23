import {
  mockCoverEnsureServerCovers,
  mockCoverReuploadLocalCovers,
  mockCoverSync,
  mockInit,
  mockInitializeLocalCovers,
  mockPing,
} from "@/app/providers/SyncProvider.test-mocks";

export const defaultSyncAdapter = { ping: mockPing, init: mockInit };

export const defaultCoverSyncService = {
  initializeLocalCovers: mockInitializeLocalCovers,
  sync: mockCoverSync,
  reuploadLocalCovers: mockCoverReuploadLocalCovers,
  ensureServerCoversAreCached: mockCoverEnsureServerCovers,
};
