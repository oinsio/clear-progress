// implements FR6, FR7, FR20 of localstorage-refactor
import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import {
  ACCENT_COLORS,
  BOX,
  DAY_BOUNDARY_CHANGED_EVENT,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_AUTO_SYNC_DELAY_SEC,
  DEFAULT_DAY_BOUNDARY,
  DEFAULT_SYNC_INTERVAL_MIN,
  STORAGE_KEYS,
  SYNC_TIMING_CHANGED_EVENT,
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

// implements FR5, D7 of configurable-sync-timing
export function getCachedSyncInterval(): number | null {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL);
    if (cached === null) {
      return DEFAULT_SYNC_INTERVAL_MIN;
    }
    if (cached === "") {
      return null;
    }
    return Number(cached);
  } catch {
    // localStorage is not available
  }
  return DEFAULT_SYNC_INTERVAL_MIN;
}

// implements FR6, D7 of configurable-sync-timing
export function getCachedAutoSyncDelay(): number {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_DELAY);
    if (cached === null) {
      return DEFAULT_AUTO_SYNC_DELAY_SEC;
    }
    // Number("") === 0 and Number("0") === 0, so no special-casing is
    // needed for the empty-string / "0" representations of "immediate".
    return Number(cached);
  } catch {
    // localStorage is not available
  }
  return DEFAULT_AUTO_SYNC_DELAY_SEC;
}

export interface UseSettingsReturn {
  defaultBox: Box;
  accentColor: AccentColor;
  dayBoundary: string;
  syncInterval: number | null;
  autoSyncDelay: number;
  isLoading: boolean;
  setDefaultBox: (box: Box) => Promise<void>;
  setAccentColor: (color: AccentColor) => Promise<void>;
  setDayBoundary: (value: string) => Promise<void>;
  setSyncInterval: (value: number | null) => Promise<void>;
  setAutoSyncDelay: (value: number) => Promise<void>;
}

export function useSettings(
  settingsService: SettingsService = defaultSettingsService,
): UseSettingsReturn {
  const [defaultBox, setDefaultBoxState] = useState<Box>(getCachedBox);
  const [accentColor, setAccentColorState] =
    useState<AccentColor>(getCachedAccentColor);
  const [dayBoundary, setDayBoundaryState] =
    useState<string>(getCachedDayBoundary);
  const [syncInterval, setSyncIntervalState] = useState<number | null>(
    getCachedSyncInterval,
  );
  const [autoSyncDelay, setAutoSyncDelayState] = useState<number>(
    getCachedAutoSyncDelay,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  const loadSettings = useCallback(async () => {
    const [box, color, boundary, interval, delay] = await Promise.all([
      settingsService.getDefaultBox(),
      settingsService.getAccentColor(),
      settingsService.getDayBoundary(),
      settingsService.getSyncIntervalMinutes(),
      settingsService.getAutoSyncDelaySeconds(),
    ]);
    syncCache(STORAGE_KEYS.DEFAULT_BOX, box);
    // FR20: accent color cache is managed by ThemeProvider only
    syncCache(STORAGE_KEYS.DAY_BOUNDARY, boundary);
    syncCache(
      STORAGE_KEYS.SYNC_INTERVAL,
      interval === null ? "" : String(interval),
    );
    syncCache(STORAGE_KEYS.AUTO_SYNC_DELAY, String(delay));
    setDefaultBoxState(box);
    setAccentColorState(color);
    setDayBoundaryState(boundary);
    setSyncIntervalState(interval);
    setAutoSyncDelayState(delay);
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

  const setSyncInterval = useCallback(
    async (value: number | null) => {
      const stringValue = value === null ? "" : String(value);
      await settingsService.set(STORAGE_KEYS.SYNC_INTERVAL, stringValue);
      await loadSettings();
      schedulePush();
      window.dispatchEvent(new CustomEvent(SYNC_TIMING_CHANGED_EVENT));
    },
    [settingsService, loadSettings, schedulePush],
  );

  const setAutoSyncDelay = useCallback(
    async (value: number) => {
      await settingsService.set(STORAGE_KEYS.AUTO_SYNC_DELAY, String(value));
      await loadSettings();
      schedulePush();
      window.dispatchEvent(new CustomEvent(SYNC_TIMING_CHANGED_EVENT));
    },
    [settingsService, loadSettings, schedulePush],
  );

  return {
    defaultBox,
    accentColor,
    dayBoundary,
    syncInterval,
    autoSyncDelay,
    isLoading,
    setDefaultBox,
    setAccentColor,
    setDayBoundary,
    setSyncInterval,
    setAutoSyncDelay,
  };
}
