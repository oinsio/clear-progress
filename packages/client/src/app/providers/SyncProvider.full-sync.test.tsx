import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FullSyncStep } from "@/types/common";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import { SyncProvider } from "./SyncProvider";
import {
  FullSyncTrigger,
  SyncVersionDisplay,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import {
  mockCoverEnsureServerCovers,
  mockCoverReuploadLocalCovers,
  mockCoverSync,
  mockPush,
  mockResetAndPull,
} from "./SyncProvider.test-mocks";

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — triggerFullSync", () => {
  function renderProviderWithFullSync(
    onProgress: (step: FullSyncStep) => void,
  ) {
    return render(
      <SyncProvider>
        <SyncVersionDisplay />
        <FullSyncTrigger onProgress={onProgress} />
      </SyncProvider>,
    );
  }

  function getSyncVersion(): number {
    return parseInt(screen.getByTestId("version").textContent ?? "0", 10);
  }

  function setupFullSyncMocks() {
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockResetAndPull.mockResolvedValue(undefined);
    mockCoverSync.mockResolvedValue(undefined);
    mockCoverReuploadLocalCovers.mockResolvedValue(undefined);
    mockCoverEnsureServerCovers.mockResolvedValue(undefined);
  }

  async function setupAndTriggerFullSync(
    onProgress: (step: FullSyncStep) => void = vi.fn(),
  ) {
    renderProviderWithFullSync(onProgress);
    await act(async () => {});
    setupFullSyncMocks();
    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-btn"));
    });
  }

  it("should call push and resetAndPull during full sync", async () => {
    await setupAndTriggerFullSync();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockResetAndPull).toHaveBeenCalledTimes(1);
  });

  it("should call coverSyncService.sync, reuploadLocalCovers and ensureServerCoversAreCached during full sync", async () => {
    await setupAndTriggerFullSync();
    expect(mockCoverSync).toHaveBeenCalledTimes(1);
    expect(mockCoverReuploadLocalCovers).toHaveBeenCalledTimes(1);
    expect(mockCoverEnsureServerCovers).toHaveBeenCalledTimes(1);
  });

  it("should report progress steps in order", async () => {
    const steps: FullSyncStep[] = [];
    await setupAndTriggerFullSync((step) => {
      steps.push(step);
    });
    expect(steps).toEqual([
      "reupload_covers",
      "upload_covers",
      "push",
      "pull",
      "download_covers",
      "done",
    ]);
  });

  it("should report error step when resetAndPull fails during full sync", async () => {
    const steps: FullSyncStep[] = [];
    const onProgress = (step: FullSyncStep) => {
      steps.push(step);
    };
    renderProviderWithFullSync(onProgress);
    await act(async () => {});
    setupFullSyncMocks();
    mockResetAndPull.mockRejectedValue(new Error("resetAndPull failed"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-btn"));
    });
    expect(steps).toContain("error");
    expect(steps).not.toContain("done");
  });

  it("should increment syncVersion after successful full sync", async () => {
    renderProviderWithFullSync(vi.fn());
    await act(async () => {});
    const versionAfterMount = getSyncVersion();
    setupFullSyncMocks();
    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-btn"));
    });
    expect(getSyncVersion()).toBeGreaterThan(versionAfterMount);
  });
});
