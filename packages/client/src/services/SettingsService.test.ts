import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOX,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_DAY_BOUNDARY,
  SETTING_KEYS,
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
      const value = await settingsService.get(SETTING_KEYS.DEFAULT_BOX);
      expect(value).toBe("inbox");
    });

    it("should return undefined when setting not found", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      const value = await settingsService.get(SETTING_KEYS.DEFAULT_BOX);
      expect(value).toBeUndefined();
    });

    it("should call repository.getValue with the given key", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.get(SETTING_KEYS.ACCENT_COLOR);
      expect(mockSettingsRepository.getValue).toHaveBeenCalledWith(
        SETTING_KEYS.ACCENT_COLOR,
      );
    });
  });

  describe("set", () => {
    it("should call repository.set with key and value", async () => {
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.set(SETTING_KEYS.ACCENT_COLOR, "green");
      expect(mockSettingsRepository.set).toHaveBeenCalledWith(
        SETTING_KEYS.ACCENT_COLOR,
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

    it("should overwrite invalid value with default and needsSync true", async () => {
      mockSettingsRepository = createMockSettingsRepository({
        getValue: vi.fn().mockResolvedValue("abc"),
      });
      const settingsService = new SettingsService(mockSettingsRepository);
      await settingsService.getDayBoundary();
      expect(mockSettingsRepository.set).toHaveBeenCalledWith(
        SETTING_KEYS.DAY_BOUNDARY,
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
});
