import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import {
  ACCENT_COLORS,
  BOX,
  DAY_BOUNDARY_CHANGED_EVENT,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_DAY_BOUNDARY,
  SETTING_KEYS,
  STORAGE_KEYS,
} from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { SettingsService } from "@/services/SettingsService";
import type { AccentColor, Box } from "@/types/common";

const defaultSettingsService = new SettingsService(new SettingsRepository());

const BOX_VALUES = Object.values(BOX) as Box[];

function getCachedBox(): Box {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.DEFAULT_BOX);
    if (cached && BOX_VALUES.includes(cached as Box)) {
      return cached as Box;
    }
  } catch {
    // localStorage недоступен
  }
  return BOX.INBOX;
}

function getCachedAccentColor(): AccentColor {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR);
    if (cached && ACCENT_COLORS.includes(cached as AccentColor)) {
      return cached as AccentColor;
    }
  } catch {
    // localStorage недоступен
  }
  return DEFAULT_ACCENT_COLOR;
}

export function getCachedDayBoundary(): string {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.DAY_BOUNDARY);
    if (cached) {
      return cached;
    }
  } catch {
    // localStorage недоступен
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
    try {
      localStorage.setItem(STORAGE_KEYS.DEFAULT_BOX, box);
      localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
      localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, boundary);
    } catch {
      // localStorage недоступен
    }
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
      await settingsService.set(SETTING_KEYS.DEFAULT_BOX, box);
      await loadSettings();
      schedulePush();
    },
    [settingsService, loadSettings, schedulePush],
  );

  const setAccentColor = useCallback(
    async (color: AccentColor) => {
      await settingsService.set(SETTING_KEYS.ACCENT_COLOR, color);
      await loadSettings();
      schedulePush();
    },
    [settingsService, loadSettings, schedulePush],
  );

  const setDayBoundary = useCallback(
    async (value: string) => {
      await settingsService.set(SETTING_KEYS.DAY_BOUNDARY, value);
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
