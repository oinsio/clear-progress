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

  describe("set", () => {
    it("should create new setting when key does not exist", async () => {
      await getRepository().set("default_box", "week");

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("week");
      expect(setting?.updated_at).toBeTruthy();
    });

    it("should update existing setting value", async () => {
      await db.settings.add(
        buildSetting({ key: "default_box", value: "inbox" }),
      );
      await getRepository().set("default_box", "today");

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("today");
    });

    it("should set updated_at to current ISO timestamp", async () => {
      const before = toISOTimestamp(Temporal.Now.instant());
      await getRepository().set("default_box", "inbox");

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting).toBeDefined();
      const updatedAt = setting?.updated_at ?? "";
      expect(updatedAt >= before).toBe(true);
      // Verify that the timestamp is not in the future (with a 500ms buffer)
      const maxAllowed = toISOTimestamp(
        Temporal.Now.instant().add({ milliseconds: 500 }),
      );
      expect(updatedAt <= maxAllowed).toBe(true);
    });

    // FR19: Settings no-op optimization
    it("should not update when value is unchanged", async () => {
      await db.settings.add(
        buildSetting({
          key: "default_box",
          value: "inbox",
          updated_at: toISOTimestamp(
            Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
          ),
        }),
      );

      await getRepository().set("default_box", "inbox");

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("inbox");
      expect(setting?.updated_at).toBe(
        toISOTimestamp(Temporal.Instant.from("2026-01-01T00:00:00.000Z")),
      );
    });

    it("should update when value changes", async () => {
      const oldTimestamp = toISOTimestamp(
        Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
      );
      await db.settings.add(
        buildSetting({
          key: "default_box",
          value: "inbox",
          updated_at: oldTimestamp,
        }),
      );

      await getRepository().set("default_box", "today");

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.value).toBe("today");
      expect(setting?.updated_at).not.toBe(oldTimestamp);
    });

    it("should set syncStatus to true when value changes", async () => {
      await db.settings.add(
        buildSetting({
          key: "default_box",
          value: "inbox",
          syncStatus: "synced" as const,
        }),
      );

      await getRepository().set("default_box", "today");

      const setting = await db.settings.get({ key: "default_box" });
      expect(setting?.syncStatus).toBe("pending");
    });
  });
});
