import {
  BOX,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_DAY_BOUNDARY,
  STORAGE_KEYS,
} from "@/constants";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository";
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
}
