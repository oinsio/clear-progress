import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUseAuth, mockUseSync, mockUseBackendConnected } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockUseSync: vi.fn(),
    mockUseBackendConnected: vi.fn(),
  }),
);

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: mockUseSync,
}));

vi.mock("@/hooks/useBackendConnected", () => ({
  useBackendConnected: mockUseBackendConnected,
}));

import { useConnectionStatus } from "./useConnectionStatus";

describe("useConnectionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: connected, authenticated, synced
    mockUseBackendConnected.mockReturnValue(true);
    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockUseSync.mockReturnValue({ syncStatus: "idle" });
  });

  it("should return not_configured when backend is not connected", () => {
    mockUseBackendConnected.mockReturnValue(false);
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("not_configured");
  });

  it("should return no_auth when backend is connected but no accessToken", () => {
    mockUseAuth.mockReturnValue({ accessToken: null });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("no_auth");
  });

  it("should return synced when connected, authenticated and syncStatus is idle", () => {
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("synced");
  });

  it("should return syncing when syncStatus is syncing", () => {
    mockUseSync.mockReturnValue({ syncStatus: "syncing" });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("syncing");
  });

  it("should return offline when syncStatus is offline", () => {
    mockUseSync.mockReturnValue({ syncStatus: "offline" });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("offline");
  });

  it("should return error when syncStatus is error", () => {
    mockUseSync.mockReturnValue({ syncStatus: "error" });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("error");
  });

  it("should return unauthorized when syncStatus is unauthorized", () => {
    mockUseSync.mockReturnValue({ syncStatus: "unauthorized" });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("unauthorized");
  });

  it("should prioritize not_configured over no_auth", () => {
    mockUseBackendConnected.mockReturnValue(false);
    mockUseAuth.mockReturnValue({ accessToken: null });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("not_configured");
  });

  it("should prioritize no_auth over syncStatus", () => {
    mockUseAuth.mockReturnValue({ accessToken: null });
    mockUseSync.mockReturnValue({ syncStatus: "error" });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("no_auth");
  });
});
