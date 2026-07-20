import type { WireSetting } from "@clear-progress/contract";
import { ClientSettingSchema } from "@/schemas/entities";
import type { ISOTimestamp, Setting } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { db } from "../database";

export class SettingsRepository {
  async getAll(): Promise<Setting[]> {
    return db.settings.toArray();
  }

  async getByKey(key: string): Promise<Setting | undefined> {
    return db.settings.get(key);
  }

  async getValue(key: string): Promise<string | undefined> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  async set(key: string, value: string): Promise<void> {
    const existing = await this.getByKey(key);

    // If the value has not changed, do nothing
    if (existing && existing.value === value) {
      return;
    }

    const updatedAt = toISOTimestamp();
    const setting: Setting = {
      key,
      value,
      updated_at: updatedAt,
      syncStatus: "pending" as const,
    };

    const result = ClientSettingSchema.safeParse(setting);
    if (!result.success) {
      console.error("Invalid setting before IndexedDB write:", result.error);
      throw new Error(`Invalid setting data: ${result.error.message}`);
    }

    await db.settings.put(setting);
  }

  async getNeedingSync(): Promise<Setting[]> {
    return db.settings
      .filter((setting) => setting.syncStatus === "pending")
      .toArray();
  }

  async clearNeedsSyncByKey(keys: string[]): Promise<void> {
    await db.settings.where("key").anyOf(keys).modify({ syncStatus: "synced" });
  }

  async bulkUpsert(settings: WireSetting[]): Promise<void> {
    if (settings.length === 0) return;

    const existingSettings = await this.getAll();
    const existingByKey = new Map(existingSettings.map((s) => [s.key, s]));

    const settingsToUpsert = settings.filter((incoming) => {
      const existing = existingByKey.get(incoming.key);
      if (existing?.syncStatus === "pending") return false;
      return !existing || incoming.updated_at > existing.updated_at;
    });

    if (settingsToUpsert.length > 0) {
      const clientSettings = settingsToUpsert.map((s) => ({
        ...s,
        updated_at: s.updated_at as ISOTimestamp,
        syncStatus: "synced" as const,
      }));

      for (const setting of clientSettings) {
        const result = ClientSettingSchema.safeParse(setting);
        if (!result.success) {
          console.error("Invalid setting in bulk operation:", result.error);
          throw new Error(`Invalid setting data: ${result.error.message}`);
        }
      }

      await db.settings.bulkPut(clientSettings);
    }
  }
}
