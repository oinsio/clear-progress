// implements FR6, FR7, FR18, FR19, FR20 of localstorage-refactor
import type * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import {
  ACCENT_COLOR_VALUES,
  ACCENT_COLOR_VALUES_DARK,
  ACCENT_COLORS,
  COLOR_SCHEMES,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_COLOR_SCHEME,
  STORAGE_KEYS,
} from "@/constants";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { getPreference, syncCache } from "@/services/localPreferencesService";
import type { AccentColor, ColorScheme } from "@/types/common";
import { hexToRgb } from "@/utils/colorHelpers";

const DEFAULT_CUSTOM_LIGHT = "#fcd34d";
const DEFAULT_CUSTOM_DARK = "#14b8a6";

interface ThemeContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => Promise<void>;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  customAccentLight: string;
  customAccentDark: string;
  setCustomAccentColors: (lightHex: string, darkHex: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const settingsRepository = new SettingsRepository();

function getInitialAccentColor(): AccentColor {
  return getPreference<AccentColor>({
    type: "enum",
    key: STORAGE_KEYS.ACCENT_COLOR,
    values: ACCENT_COLORS,
    defaultValue: DEFAULT_ACCENT_COLOR,
  });
}

function getInitialColorScheme(): ColorScheme {
  return getPreference<ColorScheme>({
    type: "enum",
    key: STORAGE_KEYS.COLOR_SCHEME,
    values: COLOR_SCHEMES,
    defaultValue: DEFAULT_COLOR_SCHEME,
  });
}

function applyColorScheme(scheme: ColorScheme): void {
  const isDark =
    scheme === "dark" ||
    (scheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(
    getInitialAccentColor,
  );
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    getInitialColorScheme,
  );
  const [customAccentLight, setCustomAccentLight] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT) ||
        DEFAULT_CUSTOM_LIGHT
      );
    } catch {
      return DEFAULT_CUSTOM_LIGHT;
    }
  });
  const [customAccentDark, setCustomAccentDark] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT_DARK) ||
        DEFAULT_CUSTOM_DARK
      );
    } catch {
      return DEFAULT_CUSTOM_DARK;
    }
  });
  const { syncVersion } = useSync();

  useEffect(() => {
    // Apply initial color to DOM on mount (ensures data-accent is set even on first launch)
    applyAccentColor(getInitialAccentColor());
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: syncVersion triggers reload after sync
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedColor = await settingsRepository.getValue(
          STORAGE_KEYS.ACCENT_COLOR,
        );

        // Validate color
        if (storedColor && ACCENT_COLORS.includes(storedColor as AccentColor)) {
          const color = storedColor as AccentColor;
          let lightHex: string | undefined;
          let darkHex: string | undefined;

          // If custom, load user-defined colors
          if (color === "custom") {
            lightHex = await settingsRepository.getValue(
              STORAGE_KEYS.CUSTOM_ACCENT_LIGHT,
            );
            darkHex = await settingsRepository.getValue(
              STORAGE_KEYS.CUSTOM_ACCENT_DARK,
            );

            if (lightHex) {
              setCustomAccentLight(lightHex);
              syncCache(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT, lightHex);
            }
            if (darkHex) {
              setCustomAccentDark(darkHex);
              syncCache(STORAGE_KEYS.CUSTOM_ACCENT_DARK, darkHex);
            }
          }

          applyAccentColor(color, lightHex, darkHex);
          setAccentColorState(color);
          syncCache(STORAGE_KEYS.ACCENT_COLOR, color);
        } else if (storedColor) {
          // Invalid color — set default and sync
          await settingsRepository.set(
            STORAGE_KEYS.ACCENT_COLOR,
            DEFAULT_ACCENT_COLOR,
          );
          applyAccentColor(DEFAULT_ACCENT_COLOR);
          setAccentColorState(DEFAULT_ACCENT_COLOR);
          syncCache(STORAGE_KEYS.ACCENT_COLOR, DEFAULT_ACCENT_COLOR);
        }
      } catch (error) {
        console.error("Failed to load accent color settings:", error);
      }
    };

    void loadSettings();
  }, [syncVersion]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (): void => {
      if (colorScheme === "system") {
        applyColorScheme("system");
        applyAccentColor(accentColor, customAccentLight, customAccentDark);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [colorScheme, accentColor, customAccentLight, customAccentDark]);

  const setAccentColor = async (color: AccentColor): Promise<void> => {
    applyAccentColor(color, customAccentLight, customAccentDark);
    setAccentColorState(color);
    syncCache(STORAGE_KEYS.ACCENT_COLOR, color);
    await settingsRepository.set(STORAGE_KEYS.ACCENT_COLOR, color);
  };

  const setCustomAccentColors = async (
    lightHex: string,
    darkHex: string,
  ): Promise<void> => {
    setCustomAccentLight(lightHex);
    setCustomAccentDark(darkHex);
    syncCache(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT, lightHex);
    syncCache(STORAGE_KEYS.CUSTOM_ACCENT_DARK, darkHex);
    await settingsRepository.set(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT, lightHex);
    await settingsRepository.set(STORAGE_KEYS.CUSTOM_ACCENT_DARK, darkHex);
    if (accentColor === "custom") {
      applyAccentColor("custom", lightHex, darkHex);
    }
  };

  const setColorScheme = (scheme: ColorScheme): void => {
    applyColorScheme(scheme);
    setColorSchemeState(scheme);
    syncCache(STORAGE_KEYS.COLOR_SCHEME, scheme);
    applyAccentColor(accentColor, customAccentLight, customAccentDark);
  };

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor,
        colorScheme,
        setColorScheme,
        customAccentLight,
        customAccentDark,
        setCustomAccentColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

function applyAccentColor(
  color: AccentColor,
  customLight?: string,
  customDark?: string,
): void {
  document.documentElement.setAttribute("data-accent", color);

  if (color === "custom") {
    const isDark = document.documentElement.classList.contains("dark");
    const hex = isDark
      ? customDark || DEFAULT_CUSTOM_DARK
      : customLight || DEFAULT_CUSTOM_LIGHT;

    try {
      const rgb = hexToRgb(hex);
      document.documentElement.style.setProperty("--color-accent", rgb);

      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", hex);
      }
    } catch (error) {
      console.error("Failed to apply custom accent color:", error);
    }
  } else {
    // Clear custom property for predefined colors
    document.documentElement.style.removeProperty("--color-accent");

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const isDark = document.documentElement.classList.contains("dark");
      const colorValue = isDark
        ? ACCENT_COLOR_VALUES_DARK[color]
        : ACCENT_COLOR_VALUES[color];
      metaThemeColor.setAttribute("content", colorValue);
    }
  }
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
