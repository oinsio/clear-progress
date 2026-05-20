import { beforeEach } from "vitest";
import { Temporal } from "@/lib/temporal";
import type { Setting } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { db } from "../database";
import { SettingsRepository } from "./SettingsRepository";

export function buildSetting(overrides: Partial<Setting> = {}): Setting {
  return <Setting>{
    key: "default_box",
    value: "inbox",
    updated_at: toISOTimestamp(
      Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
    ),
    ...overrides,
  };
}

export function createSettingsRepositorySetup(): {
  getRepository: () => SettingsRepository;
} {
  let settingsRepository: SettingsRepository;

  beforeEach(async () => {
    await db.settings.clear();
    settingsRepository = new SettingsRepository();
  });

  return {
    getRepository: () => settingsRepository,
  };
}

export { db, Temporal, toISOTimestamp };
