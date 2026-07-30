import {
  BOX,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_AUTO_SYNC_DELAY_SEC,
  DEFAULT_DAY_BOUNDARY,
  DEFAULT_SYNC_INTERVAL_MIN,
  MAX_AUTO_SYNC_DELAY_SEC,
  MAX_SYNC_INTERVAL_MIN,
  MIN_AUTO_SYNC_DELAY_SEC,
  MIN_SYNC_INTERVAL_MIN,
  STORAGE_KEYS,
} from "@/constants";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { parseIntegerSetting } from "@/services/parseIntegerSetting";
import type { AccentColor, Box } from "@/types/common";
import { isValidDayBoundary } from "@/utils/getLogicalDate";

export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async get(key: string): Promise<string | undefined> {
    return this.settingsRepository.getValue(key);
  }

  async set(key: string, value: string): Promise<void> {
    return this.settingsRepository.set(key, value);
  }

  async getDefaultBox(): Promise<Box> {
    const value = await this.settingsRepository.getValue(
      STORAGE_KEYS.DEFAULT_BOX,
    );
    return (value as Box) ?? BOX.INBOX;
  }

  async getAccentColor(): Promise<AccentColor> {
    const value = await this.settingsRepository.getValue(
      STORAGE_KEYS.ACCENT_COLOR,
    );
    return (value as AccentColor) ?? DEFAULT_ACCENT_COLOR;
  }

  /** Implements FR1, FR12 of day-boundary */
  async getDayBoundary(): Promise<string> {
    const value = await this.settingsRepository.getValue(
      STORAGE_KEYS.DAY_BOUNDARY,
    );

    if (value === undefined) {
      return DEFAULT_DAY_BOUNDARY;
    }

    if (isValidDayBoundary(value)) {
      return value;
    }

    await this.settingsRepository.set(
      STORAGE_KEYS.DAY_BOUNDARY,
      DEFAULT_DAY_BOUNDARY,
    );
    return DEFAULT_DAY_BOUNDARY;
  }

  /** Implements FR1, FR7 of configurable-sync-timing */
  async getSyncIntervalMinutes(): Promise<number | null> {
    const value = await this.settingsRepository.getValue(
      STORAGE_KEYS.SYNC_INTERVAL,
    );

    if (value === "") {
      return null;
    }

    return parseIntegerSetting(
      STORAGE_KEYS.SYNC_INTERVAL,
      value,
      MIN_SYNC_INTERVAL_MIN,
      MAX_SYNC_INTERVAL_MIN,
      DEFAULT_SYNC_INTERVAL_MIN,
    );
  }

  /** Implements FR2, FR7 of configurable-sync-timing */
  async getAutoSyncDelaySeconds(): Promise<number> {
    const value = await this.settingsRepository.getValue(
      STORAGE_KEYS.AUTO_SYNC_DELAY,
    );

    return parseIntegerSetting(
      STORAGE_KEYS.AUTO_SYNC_DELAY,
      value,
      MIN_AUTO_SYNC_DELAY_SEC,
      MAX_AUTO_SYNC_DELAY_SEC,
      DEFAULT_AUTO_SYNC_DELAY_SEC,
    );
  }
}
