// implements FR3, FR4 of fix-project-paused
import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PING_INTERVAL_MS, SYNC_INTERVAL_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import { renderProvider, setupBeforeEach } from "./SyncProvider.test-helpers";
import { mockPing, mockPull, mockPush } from "./SyncProvider.test-mocks";

class MockProjectPausedError extends Error {
  constructor() {
    super("ProjectPausedError");
    this.name = "ProjectPausedError";
  }
}

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — project paused (FR3 fix-project-paused)", () => {
  it("should set syncStatus to 'project_paused' when sync throws ProjectPausedError", async () => {
    mockPull.mockRejectedValue(new MockProjectPausedError());
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).toBe("project_paused");
  });

  it("should NOT start ping interval when status is 'project_paused'", async () => {
    mockPull.mockRejectedValue(new MockProjectPausedError());
    renderProvider();
    await act(async () => {});
    vi.clearAllMocks();

    // Advance past ping interval — ping should NOT be called
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("should continue periodic sync when status is 'project_paused'", async () => {
    mockPull.mockRejectedValue(new MockProjectPausedError());
    renderProvider();
    await act(async () => {});
    vi.clearAllMocks();
    mockPull.mockRejectedValue(new MockProjectPausedError());

    // Periodic sync should still fire
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(mockPush).toHaveBeenCalled();
  });

  it("should recover to 'idle' when sync succeeds after project_paused", async () => {
    mockPull.mockRejectedValue(new MockProjectPausedError());
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).toBe("project_paused");

    // Now project is restored, sync succeeds
    mockPull.mockResolvedValue(undefined);
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(screen.getByTestId("status").textContent).toBe("idle");
  });
});
