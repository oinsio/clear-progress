import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PING_ATTEMPTS, PING_INTERVAL_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));
vi.mock("@/db/repositories/GoalRepository", () => ({
  GoalRepository: vi.fn(),
}));
vi.mock("@/db/repositories/ContextRepository", () => ({
  ContextRepository: vi.fn(),
}));
vi.mock("@/db/repositories/CategoryRepository", () => ({
  CategoryRepository: vi.fn(),
}));
vi.mock("@/db/repositories/ChecklistRepository", () => ({
  ChecklistRepository: vi.fn(),
}));
vi.mock("@/db/repositories/SettingsRepository", () => ({
  SettingsRepository: vi.fn(),
}));
vi.mock("@/db/repositories/SyncMetaRepository", () => ({
  SyncMetaRepository: vi.fn(),
}));

import {
  renderProvider,
  setNavigatorOffline,
  setNavigatorOnline,
  setupBeforeEach,
  VALID_PING_INITIALIZED,
  VALID_PING_NOT_INITIALIZED,
} from "./SyncProvider.test-helpers";
import {
  mockInit,
  mockPing,
  mockPull,
  mockPush,
} from "./SyncProvider.test-mocks";

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — ping recovery", () => {
  it("should call push and pull when ping succeeds with initialized=true", async () => {
    setNavigatorOffline();
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
    renderProvider();
    await act(async () => {});

    vi.clearAllMocks();
    mockPull.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockInit).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should call init before push and pull when ping returns initialized=false", async () => {
    setNavigatorOffline();
    mockPing.mockResolvedValue(VALID_PING_NOT_INITIALIZED);
    const callOrder: string[] = [];
    mockInit.mockImplementation(async () => {
      callOrder.push("init");
    });
    mockPush.mockImplementation(async () => {
      callOrder.push("push");
    });
    mockPull.mockImplementation(async () => {
      callOrder.push("pull");
    });

    renderProvider();
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(callOrder).toEqual(["init", "push", "pull"]);
  });

  it("should stop pinging after successful ping", async () => {
    setNavigatorOffline();
    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
    renderProvider();
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 3);
    });
    expect(mockPing).not.toHaveBeenCalled();
  });
});

describe("SyncProvider — max ping attempts", () => {
  it("should stop pinging after MAX_PING_ATTEMPTS failures", async () => {
    setNavigatorOffline();
    mockPing.mockRejectedValue(new Error("Ping failed"));
    renderProvider();
    await act(async () => {});

    for (let i = 0; i <= MAX_PING_ATTEMPTS; i++) {
      await act(async () => {
        vi.advanceTimersByTime(PING_INTERVAL_MS);
      });
    }
    const pingCallsAtMax = mockPing.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 5);
    });
    expect(mockPing.mock.calls.length).toBe(pingCallsAtMax);
  });

  it("should reset ping attempt counter on successful reconnect", async () => {
    setNavigatorOffline();
    mockPing.mockRejectedValue(new Error("Ping failed"));
    renderProvider();
    await act(async () => {});

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 3);
    });

    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
    setNavigatorOnline();
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    const pingCallsAfterSuccess = mockPing.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS * 5);
    });
    expect(mockPing.mock.calls.length).toBe(pingCallsAfterSuccess);
  });
});
