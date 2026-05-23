import { describe, expect, it } from "vitest";
import {
  buildSetting,
  createSettingsRepositorySetup,
  db,
  Temporal,
  toISOTimestamp,
} from "./SettingsRepository.test-utils";

describe("SettingsRepository", () => {
  const { getRepository } = createSettingsRepositorySetup();

  describe("bulkUpsert", () => {
    it("should insert new settings that do not exist locally", async () => {
      const incoming = [
        buildSetting({
          key: "default_box",
          value: "today",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
          ),
        }),
      ];

      await getRepository().bulkUpsert(incoming);

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("today");
    });

    it("should update local setting when incoming has newer updated_at", async () => {
      await db.settings.add(
        buildSetting({
          key: "default_box",
          value: "inbox",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
          ),
        }),
      );

      await getRepository().bulkUpsert([
        buildSetting({
          key: "default_box",
          value: "week",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
          ),
        }),
      ]);

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("week");
    });

    it("should not overwrite local setting when incoming has older updated_at", async () => {
      await db.settings.add(
        buildSetting({
          key: "default_box",
          value: "today",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
          ),
        }),
      );

      await getRepository().bulkUpsert([
        buildSetting({
          key: "default_box",
          value: "inbox",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
          ),
        }),
      ]);

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("today");
    });

    it("should not overwrite local setting when incoming has same updated_at", async () => {
      const sameTimestamp = toISOTimestamp(
        Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
      );
      await db.settings.add(
        buildSetting({
          key: "accent_color",
          value: "green",
          updated_at: sameTimestamp,
        }),
      );

      await getRepository().bulkUpsert([
        buildSetting({
          key: "accent_color",
          value: "purple",
          updated_at: sameTimestamp,
        }),
      ]);

      const setting = await db.settings.get({ key: "accent_color" });
      expect(setting?.value).toBe("green");
    });

    it("should handle mixed incoming — update newer, skip older", async () => {
      await db.settings.bulkAdd([
        buildSetting({
          key: "default_box",
          value: "today",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
          ),
        }),
        buildSetting({
          key: "accent_color",
          value: "green",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
          ),
        }),
      ]);

      await getRepository().bulkUpsert([
        buildSetting({
          key: "default_box",
          value: "inbox",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
          ),
        }),
        buildSetting({
          key: "accent_color",
          value: "purple",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
          ),
        }),
      ]);

      const defaultBox = await db.settings.get("default_box");
      const accentColor = await db.settings.get("accent_color");
      expect(defaultBox?.value).toBe("today");
      expect(accentColor?.value).toBe("purple");
    });

    it("should do nothing when incoming array is empty", async () => {
      await db.settings.add(
        buildSetting({ key: "default_box", value: "inbox" }),
      );

      await getRepository().bulkUpsert([]);

      const settings = await getRepository().getAll();
      expect(settings).toHaveLength(1);
    });
  });
});
