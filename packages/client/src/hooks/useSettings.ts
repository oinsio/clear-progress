// implements FR6, FR7, FR20 of localstorage-refactor
import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import {
  ACCENT_COLORS,
  BOX,
  DAY_BOUNDARY_CHANGED_EVENT,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_DAY_BOUNDARY,
  STORAGE_KEYS,
} from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { getPreference, syncCache } from "@/services/localPreferencesService";
import { SettingsService } from "@/services/SettingsService";
import type { AccentColor, Box } from "@/types/common";

const defaultSettingsService = new SettingsService(new SettingsRepository());

const BOX_VALUES = Object.values(BOX) as Box[];

function getCachedBox(): Box {
  return getPreference<Box>({
    type: "enum",
    key: STORAGE_KEYS.DEFAULT_BOX,
    values: BOX_VALUES,
    defaultValue: BOX.INBOX,
  });
}

function getCachedAccentColor(): AccentColor {
  return getPreference<AccentColor>({
    type: "enum",
    key: STORAGE_KEYS.ACCENT_COLOR,
    values: ACCENT_COLORS,
    defaultValue: DEFAULT_ACCENT_COLOR,
  });
}

export function getCachedDayBoundary(): string {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.DAY_BOUNDARY);
    if (cached) {
      return cached;
    }
  } catch {
    // localStorage is not available
  }
  return DEFAULT_DAY_BOUNDARY;
}

export interface UseSettingsReturn {
  defaultBox: Box;
  accentColor: AccentColor;
  dayBoundary: string;
  isLoading: boolean;
  setDefaultBox: (box: Box) => Promise<void>;
  setAccentColor: (color: AccentColor) => Promise<void>;
  setDayBoundary: (value: string) => Promise<void>;
}

export function useSettings(
  settingsService: SettingsService = defaultSettingsService,
): UseSettingsReturn {
  const [defaultBox, setDefaultBoxState] = useState<Box>(getCachedBox);
  const [accentColor, setAccentColorState] =
    useState<AccentColor>(getCachedAccentColor);
  const [dayBoundary, setDayBoundaryState] =
    useState<string>(getCachedDayBoundary);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  const loadSettings = useCallback(async () => {
    const [box, color, boundary] = await Promise.all([
      settingsService.getDefaultBox(),
      settingsService.getAccentColor(),
      settingsService.getDayBoundary(),
    ]);
    syncCache(STORAGE_KEYS.DEFAULT_BOX, box);
    // FR20: accent color cache is managed by ThemeProvider only
    syncCache(STORAGE_KEYS.DAY_BOUNDARY, boundary);
    setDefaultBoxState(box);
    setAccentColorState(color);
    setDayBoundaryState(boundary);
    setIsLoading(false);
  }, [settingsService]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const setDefaultBox = useCallback(
    async (box: Box) => {
      await settingsService.set(STORAGE_KEYS.DEFAULT_BOX, box);
      await loadSettings();
      schedulePush();
    },
    [settingsService, loadSettings, schedulePush],
  );

  const setAccentColor = useCallback(
    async (color: AccentColor) => {
      await settingsService.set(STORAGE_KEYS.ACCENT_COLOR, color);
      await loadSettings();
      schedulePush();
    },
    [settingsService, loadSettings, schedulePush],
  );

  const setDayBoundary = useCallback(
    async (value: string) => {
      await settingsService.set(STORAGE_KEYS.DAY_BOUNDARY, value);
      await loadSettings();
      schedulePush();
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    },
    [settingsService, loadSettings, schedulePush],
  );

  return {
    defaultBox,
    accentColor,
    dayBoundary,
    isLoading,
    setDefaultBox,
    setAccentColor,
    setDayBoundary,
  };
}
