import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "./useSettings";

const syncVersionStore = vi.hoisted(() => ({ version: 0 }));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: syncVersionStore.version,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: vi.fn(),
  }),
}));

import {
  ACCENT_COLORS,
  BOX,
  DAY_BOUNDARY_CHANGED_EVENT,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_DAY_BOUNDARY,
  STORAGE_KEYS,
} from "@/constants";
import type { SettingsService } from "@/services/SettingsService";
import type { AccentColor } from "@/types/common";
import { getCachedDayBoundary } from "./useSettings";

function createMockSettingsService(
  overrides: Partial<Record<keyof SettingsService, unknown>> = {},
): SettingsService {
  return {
    getDefaultBox: vi.fn().mockResolvedValue(BOX.INBOX),
    getAccentColor: vi.fn().mockResolvedValue(DEFAULT_ACCENT_COLOR),
    getDayBoundary: vi.fn().mockResolvedValue(DEFAULT_DAY_BOUNDARY),
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SettingsService;
}

describe("useSettings", () => {
  let mockSettingsService: SettingsService;

  beforeEach(() => {
    mockSettingsService = createMockSettingsService();
    syncVersionStore.version = 0;
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after settings are loaded", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should return default box after loading", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultBox).toBe(BOX.INBOX);
  });

  it("should return accent color after loading", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.accentColor).toBe(DEFAULT_ACCENT_COLOR);
  });

  it("should call service with configured default box", async () => {
    mockSettingsService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(BOX.TODAY),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultBox).toBe(BOX.TODAY);
  });

  it("should call set with STORAGE_KEYS.DEFAULT_BOX when setDefaultBox is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDefaultBox(BOX.WEEK);
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.DEFAULT_BOX,
      BOX.WEEK,
    );
    expect(mockSettingsService.getDefaultBox).toHaveBeenCalledTimes(2);
  });

  it("should call set with STORAGE_KEYS.ACCENT_COLOR when setAccentColor is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setAccentColor("orange");
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCENT_COLOR,
      "orange",
    );
    expect(mockSettingsService.getAccentColor).toHaveBeenCalledTimes(2);
  });

  it("should update defaultBox state after setDefaultBox is called", async () => {
    mockSettingsService = createMockSettingsService({
      getDefaultBox: vi
        .fn()
        .mockResolvedValueOnce(BOX.INBOX)
        .mockResolvedValueOnce(BOX.WEEK),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDefaultBox(BOX.WEEK);
    });

    expect(result.current.defaultBox).toBe(BOX.WEEK);
  });

  it("should update accentColor state after setAccentColor is called", async () => {
    mockSettingsService = createMockSettingsService({
      getAccentColor: vi
        .fn()
        .mockResolvedValueOnce(DEFAULT_ACCENT_COLOR)
        .mockResolvedValueOnce("purple"),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setAccentColor("purple");
    });

    expect(result.current.accentColor).toBe("purple");
  });

  it("should use STORAGE_KEYS.DEFAULT_BOX constant (not 'default_box' magic string)", () => {
    expect(STORAGE_KEYS.DEFAULT_BOX).toBe("default_box");
  });

  it("should use STORAGE_KEYS.ACCENT_COLOR constant (not 'accent_color' magic string)", () => {
    expect(STORAGE_KEYS.ACCENT_COLOR).toBe("accent_color");
  });

  it("should reload settings when settingsService changes", async () => {
    const firstService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(BOX.INBOX),
    });
    const secondService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(BOX.WEEK),
    });
    const { result, rerender } = renderHook(
      ({ service }: { service: SettingsService }) => useSettings(service),
      { initialProps: { service: firstService } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ service: secondService });
    await waitFor(() => expect(result.current.defaultBox).toBe(BOX.WEEK));
    expect(secondService.getDefaultBox).toHaveBeenCalled();
  });

  it.each(
    ACCENT_COLORS,
  )("should accept '%s' as valid accent color", async (color: AccentColor) => {
    mockSettingsService = createMockSettingsService({
      getAccentColor: vi.fn().mockResolvedValue(color),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.accentColor).toBe(color);
  });

  it.each([
    BOX.INBOX,
    BOX.TODAY,
    BOX.WEEK,
    BOX.LATER,
  ])("should accept '%s' as valid default box", async (box) => {
    mockSettingsService = createMockSettingsService({
      getDefaultBox: vi.fn().mockResolvedValue(box),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.defaultBox).toBe(box);
  });

  it("should return dayBoundary default after loading", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dayBoundary).toBe(DEFAULT_DAY_BOUNDARY);
  });

  it("should load dayBoundary from settingsService.getDayBoundary()", async () => {
    mockSettingsService = createMockSettingsService({
      getDayBoundary: vi.fn().mockResolvedValue("04:00"),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dayBoundary).toBe("04:00");
  });

  it("should call set with STORAGE_KEYS.DAY_BOUNDARY when setDayBoundary is called", async () => {
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDayBoundary("05:00");
    });

    expect(mockSettingsService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.DAY_BOUNDARY,
      "05:00",
    );
    expect(mockSettingsService.getDayBoundary).toHaveBeenCalledTimes(2);
  });

  it("should update dayBoundary state after setDayBoundary is called", async () => {
    mockSettingsService = createMockSettingsService({
      getDayBoundary: vi
        .fn()
        .mockResolvedValueOnce(DEFAULT_DAY_BOUNDARY)
        .mockResolvedValueOnce("03:00"),
    });
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDayBoundary("03:00");
    });

    expect(result.current.dayBoundary).toBe("03:00");
  });

  it("should cache dayBoundary to localStorage after loading", async () => {
    mockSettingsService = createMockSettingsService({
      getDayBoundary: vi.fn().mockResolvedValue("02:00"),
    });
    renderHook(() => useSettings(mockSettingsService));
    await waitFor(() =>
      expect(localStorage.getItem(STORAGE_KEYS.DAY_BOUNDARY)).toBe("02:00"),
    );
  });

  it("should dispatch DAY_BOUNDARY_CHANGED_EVENT when setDayBoundary is called", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const { result } = renderHook(() => useSettings(mockSettingsService));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setDayBoundary("06:00");
    });

    const matchingEvent = dispatchSpy.mock.calls.find(
      ([event]) =>
        event instanceof CustomEvent &&
        event.type === DAY_BOUNDARY_CHANGED_EVENT,
    );
    expect(matchingEvent).toBeDefined();
    dispatchSpy.mockRestore();
  });

  it("should use STORAGE_KEYS.DAY_BOUNDARY constant (not 'day_boundary' magic string)", () => {
    expect(STORAGE_KEYS.DAY_BOUNDARY).toBe("day_boundary");
  });

  describe("getCachedDayBoundary", () => {
    it("should return DEFAULT_DAY_BOUNDARY when localStorage is empty", () => {
      localStorage.removeItem(STORAGE_KEYS.DAY_BOUNDARY);
      expect(getCachedDayBoundary()).toBe(DEFAULT_DAY_BOUNDARY);
    });

    it("should return cached value from localStorage", () => {
      localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "04:00");
      expect(getCachedDayBoundary()).toBe("04:00");
    });

    it("should return DEFAULT_DAY_BOUNDARY when localStorage throws", () => {
      const originalGetItem = localStorage.getItem.bind(localStorage);
      localStorage.getItem = () => {
        throw new Error("localStorage unavailable");
      };
      expect(getCachedDayBoundary()).toBe(DEFAULT_DAY_BOUNDARY);
      localStorage.getItem = originalGetItem;
    });
  });
});
