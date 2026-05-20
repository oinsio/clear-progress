import { describe, expect, it } from "vitest";
import {
  buildSetting,
  createSettingsRepositorySetup,
  db,
} from "./SettingsRepository.test-utils";

describe("SettingsRepository", () => {
  const { getRepository } = createSettingsRepositorySetup();

  describe("getAll", () => {
    it("should return empty array when no settings exist", async () => {
      const settings = await getRepository().getAll();
      expect(settings).toEqual([]);
    });

    it("should return all settings", async () => {
      await db.settings.bulkAdd([
        buildSetting({ key: "default_box", value: "inbox" }),
        buildSetting({ key: "accent_color", value: "green" }),
      ]);

      const settings = await getRepository().getAll();
      expect(settings).toHaveLength(2);
    });
  });

  describe("getByKey", () => {
    it("should return setting when key exists", async () => {
      const setting = buildSetting({ key: "default_box", value: "today" });
      await db.settings.add(setting);

      const result = await getRepository().getByKey("default_box");
      expect(result).toEqual(setting);
    });

    it("should return undefined when key does not exist", async () => {
      const result = await getRepository().getByKey("nonexistent_key");
      expect(result).toBeUndefined();
    });
  });

  describe("getValue", () => {
    it("should return value when key exists", async () => {
      await db.settings.add(
        buildSetting({ key: "accent_color", value: "purple" }),
      );

      const value = await getRepository().getValue("accent_color");
      expect(value).toBe("purple");
    });

    it("should return undefined when key does not exist", async () => {
      const value = await getRepository().getValue("nonexistent_key");
      expect(value).toBeUndefined();
    });
  });
});
