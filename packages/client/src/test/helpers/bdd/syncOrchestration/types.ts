// implements sync-orchestration of sync-update
import type { Mock } from "vitest";
import type { FullSyncStep } from "@/types/common";

export type SyncTestContext = {
  mockPull: Mock;
  mockPush: Mock;
  mockPing: Mock;
  mockInit: Mock;
  mockCoverSync: Mock;
  mockInitializeLocalCovers: Mock;
  mockResetAndPull: Mock;
  mockReuploadLocalCovers: Mock;
  mockEnsureServerCoversAreCached: Mock;
  mockSignOut: Mock;
  mockSilentRefresh: Mock;
  syncProviderUnmount?: () => void;
  initialSyncCallCount?: number;
  debouncedSyncStartTime?: number;
  progressSteps: FullSyncStep[];
  initialSyncVersion: number;
};
