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

  describe("getChangedSince", () => {
    it("should return settings with updated_at after since", async () => {
      const oldSetting = buildSetting({
        key: "default_box",
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
        ),
      });
      const newSetting = buildSetting({
        key: "accent_color",
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
        ),
      });
      await db.settings.bulkAdd([oldSetting, newSetting]);

      const settings = await getRepository().getChangedSince(
        toISOTimestamp(Temporal.Instant.from("2026-02-01T00:00:00.000Z")),
      );
      expect(settings).toHaveLength(1);
      expect(settings[0].key).toBe(newSetting.key);
    });

    it("should return empty array when no settings are newer than since", async () => {
      await db.settings.add(
        buildSetting({
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
          ),
        }),
      );

      const settings = await getRepository().getChangedSince(
        toISOTimestamp(Temporal.Instant.from("2026-06-01T00:00:00.000Z")),
      );
      expect(settings).toEqual([]);
    });

    it("should not include settings with updated_at equal to since", async () => {
      await db.settings.add(
        buildSetting({
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-03-01T00:00:00.000Z"),
          ),
        }),
      );

      const settings = await getRepository().getChangedSince(
        toISOTimestamp(Temporal.Instant.from("2026-03-01T00:00:00.000Z")),
      );
      expect(settings).toEqual([]);
    });
  });
});
