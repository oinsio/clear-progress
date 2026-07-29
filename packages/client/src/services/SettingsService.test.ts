import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOX,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_AUTO_SYNC_DELAY_SEC,
  DEFAULT_DAY_BOUNDARY,
  DEFAULT_SYNC_INTERVAL_MIN,
  MAX_SYNC_INTERVAL_MIN,
  MIN_SYNC_INTERVAL_MIN,
  STORAGE_KEYS,
} from "@/constants";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SettingsService } from "./SettingsService";

function createMockSettingsRepository(
  overrides: Partial<Record<keyof SettingsRepository, unknown>> = {},
): SettingsRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getByKey: vi.fn().mockResolvedValue(undefined),
    getValue: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SettingsRepository;
}

describe("SettingsService", () => {
  let mockSettingsRepository: SettingsRepository;

  beforeEach(() => {
    mockSettingsRepository = createMockSettingsRepository();
  });

  describe("get", () => {
    it("should return value when setting exists", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("inbox"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const value = await settingsService.get(STORAGE_KEYS.DEFAULT_BOX);
      expect(value).toBe("inbox");
    });

    it("should return undefined when setting not found", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const value = await settingsService.get(STORAGE_KEYS.DEFAULT_BOX);
      expect(value).toBeUndefined();
    });

    it("should call repository.getValue with the given key", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.get(STORAGE_KEYS.ACCENT_COLOR);
      expect(mockSettingsRepository.getValue).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCENT_COLOR,
      );
    });
  });

  describe("set", () => {
    it("should call repository.set with key and value", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.set(STORAGE_KEYS.ACCENT_COLOR, "green");
      expect(mockSettingsRepository.set).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCENT_COLOR,
        "green",
      );
    });
  });

  describe("getDefaultBox", () => {
    it("should return stored box when setting exists", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("today"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const box = await settingsService.getDefaultBox();
      expect(box).toBe("today");
    });

    it("should return BOX.INBOX as fallback when setting not found", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const box = await settingsService.getDefaultBox();
      expect(box).toBe(BOX.INBOX);
    });
  });

  describe("getAccentColor", () => {
    it("should return stored accent color when setting exists", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("purple"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const color = await settingsService.getAccentColor();
      expect(color).toBe("purple");
    });

    it("should return DEFAULT_ACCENT_COLOR as fallback when setting not found", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const color = await settingsService.getAccentColor();
      expect(color).toBe(DEFAULT_ACCENT_COLOR);
    });
  });

  // implements FR1, FR12 of day-boundary
  describe("getDayBoundary", () => {
    it("should return DEFAULT_DAY_BOUNDARY when no setting exists", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const dayBoundary = await settingsService.getDayBoundary();
      expect(dayBoundary).toBe(DEFAULT_DAY_BOUNDARY);
    });

    it("should return stored value when valid", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("02:00"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const dayBoundary = await settingsService.getDayBoundary();
      expect(dayBoundary).toBe("02:00");
    });

    it("should return DEFAULT_DAY_BOUNDARY when stored value is invalid", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("abc"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const dayBoundary = await settingsService.getDayBoundary();
      expect(dayBoundary).toBe(DEFAULT_DAY_BOUNDARY);
    });

    it("should overwrite invalid value with default and syncStatus true", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("abc"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.getDayBoundary();
      expect(mockSettingsRepository.set).toHaveBeenCalledWith(
        STORAGE_KEYS.DAY_BOUNDARY,
        DEFAULT_DAY_BOUNDARY,
      );
    });

    it("should NOT trigger healing write for valid values", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("02:00"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.getDayBoundary();
      expect(mockSettingsRepository.set).not.toHaveBeenCalled();
    });

    it("should NOT trigger healing write when setting is missing", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.getDayBoundary();
      expect(mockSettingsRepository.set).not.toHaveBeenCalled();
    });
  });

  // implements FR1, FR6, FR7 of configurable-sync-timing
  // "disabled" sentinel: null (no established sentinel convention found in
  // src/types for optional numeric settings, so null is chosen per D2)
  describe("getSyncIntervalMinutes", () => {
    it("should return DEFAULT_SYNC_INTERVAL_MIN when no setting exists", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const syncIntervalMinutes =
        await settingsService.getSyncIntervalMinutes();
      expect(syncIntervalMinutes).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    });

    it("should return the parsed number when a valid in-range value is stored", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("30"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const syncIntervalMinutes =
        await settingsService.getSyncIntervalMinutes();
      expect(syncIntervalMinutes).toBe(30);
    });

    it("should return null (disabled sentinel) when stored value is empty string", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(""),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const syncIntervalMinutes =
        await settingsService.getSyncIntervalMinutes();
      expect(syncIntervalMinutes).toBeNull();
    });

    it.each([
      ["below minimum", "0"],
      ["above maximum", "1441"],
      ["non-numeric", "abc"],
      ["non-integer", "2.5"],
    ])("should return DEFAULT_SYNC_INTERVAL_MIN when stored value is %s (%s)", async (_label, storedValue) => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(storedValue),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const syncIntervalMinutes =
        await settingsService.getSyncIntervalMinutes();
      expect(syncIntervalMinutes).toBe(DEFAULT_SYNC_INTERVAL_MIN);
    });

    it("should return MIN_SYNC_INTERVAL_MIN when stored value equals the minimum boundary", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(String(MIN_SYNC_INTERVAL_MIN)),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const syncIntervalMinutes =
        await settingsService.getSyncIntervalMinutes();
      expect(syncIntervalMinutes).toBe(MIN_SYNC_INTERVAL_MIN);
    });

    it("should return MAX_SYNC_INTERVAL_MIN when stored value equals the maximum boundary", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(String(MAX_SYNC_INTERVAL_MIN)),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const syncIntervalMinutes =
        await settingsService.getSyncIntervalMinutes();
      expect(syncIntervalMinutes).toBe(MAX_SYNC_INTERVAL_MIN);
    });

    it.each([
      ["absent", undefined],
      ["valid", "30"],
      ["empty string", ""],
      ["out-of-range", "0"],
      ["non-numeric", "abc"],
    ])("should NOT call repository.set when stored value is %s", async (_label, storedValue) => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(storedValue),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.getSyncIntervalMinutes();
      expect(mockSettingsRepository.set).not.toHaveBeenCalled();
    });
  });

  // implements FR1, FR6, FR7 of configurable-sync-timing
  describe("getAutoSyncDelaySeconds", () => {
    it("should return DEFAULT_AUTO_SYNC_DELAY_SEC when no setting exists", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const autoSyncDelaySeconds =
        await settingsService.getAutoSyncDelaySeconds();
      expect(autoSyncDelaySeconds).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    });

    it("should return the parsed number when a valid in-range value is stored", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("30"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const autoSyncDelaySeconds =
        await settingsService.getAutoSyncDelaySeconds();
      expect(autoSyncDelaySeconds).toBe(30);
    });

    it.each([
      ["stored value is 0", "0"],
      ["stored value is empty string", ""],
    ])("should return 0 (immediate) when %s", async (_label, storedValue) => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(storedValue),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const autoSyncDelaySeconds =
        await settingsService.getAutoSyncDelaySeconds();
      expect(autoSyncDelaySeconds).toBe(0);
    });

    it.each([
      ["below minimum", "-1"],
      ["above maximum", "901"],
      ["non-numeric", "abc"],
      ["non-integer", "2.5"],
    ])("should return DEFAULT_AUTO_SYNC_DELAY_SEC when stored value is %s (%s)", async (_label, storedValue) => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(storedValue),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      const autoSyncDelaySeconds =
        await settingsService.getAutoSyncDelaySeconds();
      expect(autoSyncDelaySeconds).toBe(DEFAULT_AUTO_SYNC_DELAY_SEC);
    });

    it.each([
      ["absent", undefined],
      ["valid", "30"],
      ["zero", "0"],
      ["empty string", ""],
      ["out-of-range", "901"],
      ["non-numeric", "abc"],
    ])("should NOT call repository.set when stored value is %s", async (_label, storedValue) => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue(storedValue),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.getAutoSyncDelaySeconds();
      expect(mockSettingsRepository.set).not.toHaveBeenCalled();
    });
  });
});
