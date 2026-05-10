// implements sync-orchestration of sync-update
import type { Mock } from "vitest";

export type SyncTestContext = {
  mockPull: Mock;
  mockPush: Mock;
  mockPing: Mock;
  mockInit: Mock;
  mockCoverSync: Mock;
  mockInitializeLocalCovers: Mock;
  mockSignOut: Mock;
  mockSilentRefresh: Mock;
  syncProviderUnmount?: () => void;
  initialSyncCallCount?: number;
  debouncedSyncStartTime?: number;
};
