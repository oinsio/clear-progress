import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { localFileCache } from "@/services/LocalFileCache";
import { useFileUrl } from "./useFileUrl";

vi.mock("@/services/defaultServices", () => ({
  defaultFileSyncService: {
    ensureFileCached: vi.fn().mockResolvedValue(undefined),
  },
}));

import { defaultFileSyncService } from "@/services/defaultServices";

const mockEnsureFileCached =
  defaultFileSyncService.ensureFileCached as ReturnType<typeof vi.fn>;

describe("useFileUrl", () => {
  afterEach(() => {
    localFileCache.clear();
    vi.clearAllMocks();
  });

  it("should return null url for empty fileId", () => {
    const { result } = renderHook(() => useFileUrl(""));
    expect(result.current.url).toBeNull();
  });

  it("should return object URL from cache for cached remote fileId", () => {
    const cachedUrl = "blob:http://localhost/cached";
    localFileCache.set("remote-id", cachedUrl);

    const { result } = renderHook(() => useFileUrl("remote-id"));

    expect(result.current.url).toBe(cachedUrl);
  });

  it("should return null for uncached remote fileId", () => {
    const { result } = renderHook(() => useFileUrl("remote-id"));

    expect(result.current.url).toBeNull();
  });

  it("should call ensureFileCached for uncached remote fileId", () => {
    renderHook(() => useFileUrl("remote-id-uncached"));

    expect(mockEnsureFileCached).toHaveBeenCalledWith("remote-id-uncached");
  });

  it("should not call ensureFileCached for empty fileId", () => {
    renderHook(() => useFileUrl(""));

    expect(mockEnsureFileCached).not.toHaveBeenCalled();
  });

  it("should not call ensureFileCached when file already in localFileCache", () => {
    localFileCache.set("cached-remote-id", "blob:http://localhost/existing");

    renderHook(() => useFileUrl("cached-remote-id"));

    expect(mockEnsureFileCached).not.toHaveBeenCalled();
  });

  it("should call ensureFileCached once when fileId does not change", () => {
    const { rerender } = renderHook(() => useFileUrl("stable-id"));
    rerender();
    rerender();

    expect(mockEnsureFileCached).toHaveBeenCalledTimes(1);
  });

  it("should update url to blob URL after ensureFileCached resolves and populates cache", async () => {
    let resolveCache!: () => void;
    mockEnsureFileCached.mockImplementation((fileId: string) => {
      return new Promise<void>((resolve) => {
        resolveCache = () => {
          localFileCache.set(fileId, "blob:http://localhost/newly-cached");
          resolve();
        };
      });
    });

    const { result } = renderHook(() =>
      useFileUrl("remote-id-uncached-reactive"),
    );

    expect(result.current.url).toBeNull();

    await act(async () => {
      resolveCache();
    });

    expect(result.current.url).toBe("blob:http://localhost/newly-cached");
  });

  it("should return cached blob URL for hash in cache", () => {
    localFileCache.set("some-hash", "blob:http://localhost/local");

    const { result } = renderHook(() => useFileUrl("some-hash"));

    expect(result.current.url).toBe("blob:http://localhost/local");
  });
});
