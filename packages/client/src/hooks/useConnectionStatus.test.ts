import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockUseSync, mockUseConnectionConfig } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockUseSync: vi.fn(),
    mockUseConnectionConfig: vi.fn(),
  }),
);

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: mockUseSync,
}));

vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: mockUseConnectionConfig,
}));

import { useConnectionStatus } from "./useConnectionStatus";

describe("useConnectionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: connected, authenticated, synced
    mockUseConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://test.supabase.co",
      anonKey: "test-key",
    });
    mockUseAuth.mockReturnValue({ accessToken: "token-123" });
    mockUseSync.mockReturnValue({ syncStatus: "idle" });
  });

  it("should return not_configured when backend is not connected", () => {
    mockUseConnectionConfig.mockReturnValue(null);
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("not_configured");
  });

  it("should return synced when connected and idle", () => {
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

  it("should prioritize not_configured over sync status", () => {
    mockUseConnectionConfig.mockReturnValue(null);
    mockUseAuth.mockReturnValue({ accessToken: null });
    mockUseSync.mockReturnValue({ syncStatus: "error" });
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toBe("not_configured");
  });
});
