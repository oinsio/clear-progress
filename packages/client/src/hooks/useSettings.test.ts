import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "./useSettings";

const syncVersionStore = vi.hoisted(() => ({ version: 0 }));
const schedulePushMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: syncVersionStore.version,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: schedulePushMock,
  }),
}));

import {
  ACCENT_COLORS,
  BOX,
  DAY_BOUNDARY_CHANGED_EVENT,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_AUTO_SYNC_DELAY_SEC,
  DEFAULT_DAY_BOUNDARY,
  DEFAULT_SYNC_INTERVAL_MIN,
  STORAGE_KEYS,
  SYNC_TIMING_CHANGED_EVENT,
} from "@/constants";
import type { SettingsService } from "@/services/SettingsService";
import type { AccentColor } from "@/types/common";
import {
  getCachedAutoSyncDelay,
  getCachedDayBoundary,
  getCachedSyncInterval,
} from "./useSettings";

function createMockSettingsService(
  overrides: Partial<Record<keyof SettingsService, unknown>> = {},
): SettingsService {
  return {
    getDefaultBox: vi.fn().mockResolvedValue(BOX.INBOX),
    getAccentColor: vi.fn().mockResolvedValue(DEFAULT_ACCENT_COLOR),
    getDayBoundary: vi.fn().mockResolvedValue(DEFAULT_DAY_BOUNDARY),
    getSyncIntervalMinutes: vi
      .fn()
      .mockResolvedValue(DEFAULT_SYNC_INTERVAL_MIN),
    getAutoSyncDelaySeconds: vi
      .fn()
      .mockResolvedValue(DEFAULT_AUTO_SYNC_DELAY_SEC),
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
    schedulePushMock.mockClear();
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

  // implements FR5, NFR-P1, D7 of configurable-sync-timing
  describe("syncInterval", () => {
    it("should return syncInterval default after loading", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.syncInterval).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    });

    it("should load syncInterval from settingsService.getSyncIntervalMinutes()", async () => {
      mockSettingsService = createMockSettingsService({
        getSyncIntervalMinutes: vi.fn().mockResolvedValue(30),
      });
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.syncInterval).toBe(30);
    });

    it("should return null for syncInterval when disabled", async () => {
      mockSettingsService = createMockSettingsService({
        getSyncIntervalMinutes: vi.fn().mockResolvedValue(null),
      });
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.syncInterval).toBeNull();
    });

    it("should call set with STORAGE_KEYS.SYNC_INTERVAL when setSyncInterval is called", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setSyncInterval(30);
      });

      expect(mockSettingsService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.SYNC_INTERVAL,
        "30",
      );
    });

    it("should call set with empty string when setSyncInterval(null) is called", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setSyncInterval(null);
      });

      expect(mockSettingsService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.SYNC_INTERVAL,
        "",
      );
    });

    it("should update syncInterval state after setSyncInterval is called", async () => {
      mockSettingsService = createMockSettingsService({
        getSyncIntervalMinutes: vi
          .fn()
          .mockResolvedValueOnce(DEFAULT_SYNC_INTERVAL_MIN)
          .mockResolvedValueOnce(60),
      });
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setSyncInterval(60);
      });

      expect(result.current.syncInterval).toBe(60);
    });

    it("should cache syncInterval to localStorage after loading", async () => {
      mockSettingsService = createMockSettingsService({
        getSyncIntervalMinutes: vi.fn().mockResolvedValue(45),
      });
      renderHook(() => useSettings(mockSettingsService));
      await waitFor(() =>
        expect(localStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL)).toBe("45"),
      );
    });

    it("should cache syncInterval as empty string when disabled (null)", async () => {
      mockSettingsService = createMockSettingsService({
        getSyncIntervalMinutes: vi.fn().mockResolvedValue(null),
      });
      renderHook(() => useSettings(mockSettingsService));
      await waitFor(() =>
        expect(localStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL)).toBe(""),
      );
    });

    it("should use the latest settingsService when setSyncInterval is called after settingsService changes", async () => {
      const firstService = createMockSettingsService({
        getSyncIntervalMinutes: vi
          .fn()
          .mockResolvedValue(DEFAULT_SYNC_INTERVAL_MIN),
      });
      const secondService = createMockSettingsService({
        getSyncIntervalMinutes: vi.fn().mockResolvedValue(30),
      });
      const { result, rerender } = renderHook(
        ({ service }: { service: SettingsService }) => useSettings(service),
        { initialProps: { service: firstService } },
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      rerender({ service: secondService });
      await waitFor(() => expect(result.current.syncInterval).toBe(30));

      await act(async () => {
        await result.current.setSyncInterval(60);
      });

      expect(secondService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.SYNC_INTERVAL,
        "60",
      );
      expect(firstService.set).not.toHaveBeenCalled();
    });

    it("should call schedulePush exactly once when setSyncInterval is called", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setSyncInterval(30);
      });

      expect(schedulePushMock).toHaveBeenCalledTimes(1);
    });

    it("should dispatch SYNC_TIMING_CHANGED_EVENT when setSyncInterval is called", async () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setSyncInterval(30);
      });

      const matchingEvent = dispatchSpy.mock.calls.find(
        ([event]) =>
          event instanceof CustomEvent &&
          event.type === SYNC_TIMING_CHANGED_EVENT,
      );
      expect(matchingEvent).toBeDefined();
      dispatchSpy.mockRestore();
    });
  });

  // implements FR6, NFR-P1, D7 of configurable-sync-timing
  describe("autoSyncDelay", () => {
    it("should return autoSyncDelay default after loading", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.autoSyncDelay).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    });

    it("should load autoSyncDelay from settingsService.getAutoSyncDelaySeconds()", async () => {
      mockSettingsService = createMockSettingsService({
        getAutoSyncDelaySeconds: vi.fn().mockResolvedValue(60),
      });
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.autoSyncDelay).toBe(60);
    });

    it("should return 0 for autoSyncDelay when immediate", async () => {
      mockSettingsService = createMockSettingsService({
        getAutoSyncDelaySeconds: vi.fn().mockResolvedValue(0),
      });
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.autoSyncDelay).toBe(0);
    });

    it("should call set with STORAGE_KEYS.AUTO_SYNC_DELAY when setAutoSyncDelay is called", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setAutoSyncDelay(60);
      });

      expect(mockSettingsService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTO_SYNC_DELAY,
        "60",
      );
    });

    it("should call set with '0' when setAutoSyncDelay(0) is called", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setAutoSyncDelay(0);
      });

      expect(mockSettingsService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTO_SYNC_DELAY,
        "0",
      );
    });

    it("should use the latest settingsService when setAutoSyncDelay is called after settingsService changes", async () => {
      const firstService = createMockSettingsService({
        getAutoSyncDelaySeconds: vi
          .fn()
          .mockResolvedValue(DEFAULT_AUTO_SYNC_DELAY_SEC),
      });
      const secondService = createMockSettingsService({
        getAutoSyncDelaySeconds: vi.fn().mockResolvedValue(60),
      });
      const { result, rerender } = renderHook(
        ({ service }: { service: SettingsService }) => useSettings(service),
        { initialProps: { service: firstService } },
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      rerender({ service: secondService });
      await waitFor(() => expect(result.current.autoSyncDelay).toBe(60));

      await act(async () => {
        await result.current.setAutoSyncDelay(120);
      });

      expect(secondService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTO_SYNC_DELAY,
        "120",
      );
      expect(firstService.set).not.toHaveBeenCalled();
    });

    it("should update autoSyncDelay state after setAutoSyncDelay is called", async () => {
      mockSettingsService = createMockSettingsService({
        getAutoSyncDelaySeconds: vi
          .fn()
          .mockResolvedValueOnce(DEFAULT_AUTO_SYNC_DELAY_SEC)
          .mockResolvedValueOnce(120),
      });
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setAutoSyncDelay(120);
      });

      expect(result.current.autoSyncDelay).toBe(120);
    });

    it("should cache autoSyncDelay to localStorage after loading", async () => {
      mockSettingsService = createMockSettingsService({
        getAutoSyncDelaySeconds: vi.fn().mockResolvedValue(90),
      });
      renderHook(() => useSettings(mockSettingsService));
      await waitFor(() =>
        expect(localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_DELAY)).toBe("90"),
      );
    });

    it("should call schedulePush exactly once when setAutoSyncDelay is called", async () => {
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setAutoSyncDelay(60);
      });

      expect(schedulePushMock).toHaveBeenCalledTimes(1);
    });

    it("should dispatch SYNC_TIMING_CHANGED_EVENT when setAutoSyncDelay is called", async () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      const { result } = renderHook(() => useSettings(mockSettingsService));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.setAutoSyncDelay(60);
      });

      const matchingEvent = dispatchSpy.mock.calls.find(
        ([event]) =>
          event instanceof CustomEvent &&
          event.type === SYNC_TIMING_CHANGED_EVENT,
      );
      expect(matchingEvent).toBeDefined();
      dispatchSpy.mockRestore();
    });
  });

  describe("getCachedSyncInterval", () => {
    it("should return DEFAULT_SYNC_INTERVAL_MIN when localStorage is empty", () => {
      localStorage.removeItem(STORAGE_KEYS.SYNC_INTERVAL);
      expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    });

    it("should return cached value from localStorage", () => {
      localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "30");
      expect(getCachedSyncInterval()).toBe(30);
    });

    it("should return DEFAULT_SYNC_INTERVAL_MIN when localStorage throws", () => {
      const originalGetItem = localStorage.getItem.bind(localStorage);
      localStorage.getItem = () => {
        throw new Error("localStorage unavailable");
      };
      expect(getCachedSyncInterval()).toBe(DEFAULT_SYNC_INTERVAL_MIN);
      localStorage.getItem = originalGetItem;
    });

    it("should return null when localStorage has empty string cached (disabled)", () => {
      localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "");
      expect(getCachedSyncInterval()).toBeNull();
    });
  });

  describe("getCachedAutoSyncDelay", () => {
    it("should return DEFAULT_AUTO_SYNC_DELAY_SEC when localStorage is empty", () => {
      localStorage.removeItem(STORAGE_KEYS.AUTO_SYNC_DELAY);
      expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    });

    it("should return cached value from localStorage", () => {
      localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "60");
      expect(getCachedAutoSyncDelay()).toBe(60);
    });

    it("should return DEFAULT_AUTO_SYNC_DELAY_SEC when localStorage throws", () => {
      const originalGetItem = localStorage.getItem.bind(localStorage);
      localStorage.getItem = () => {
        throw new Error("localStorage unavailable");
      };
      expect(getCachedAutoSyncDelay()).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
      localStorage.getItem = originalGetItem;
    });

    it('should return 0 when localStorage has empty string or "0" cached (immediate)', () => {
      localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "");
      expect(getCachedAutoSyncDelay()).toBe(0);
      localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "0");
      expect(getCachedAutoSyncDelay()).toBe(0);
    });
  });
});
