// implements sync-orchestration of sync-update
import type { Mock } from "vitest";
import type { FullSyncStep } from "@/types/common";

export type SyncTestContext = {
  mockPull: Mock;
  mockPush: Mock;
  mockPing: Mock;
  mockInit: Mock;
  mockFileSync: Mock;
  mockInitializeLocalFiles: Mock;
  mockResetAndPull: Mock;
  mockReuploadLocalFiles: Mock;
  mockEnsureServerFilesAreCached: Mock;
  mockSignOut: Mock;
  mockSilentRefresh: Mock;
  syncProviderUnmount?: () => void;
  initialSyncCallCount?: number;
  debouncedSyncStartTime?: number;
  progressSteps: FullSyncStep[];
  initialSyncVersion: number;
};
