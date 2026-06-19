import { Moon, Sun } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/app/providers/ThemeProvider";
import {
  ACCENT_COLOR_VALUES,
  ACCENT_COLOR_VALUES_DARK,
  ACCENT_COLORS,
} from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { AccentColor } from "@/types/common";
import { SyncIndicator } from "./SyncIndicator";

/** Implements FR2 of settings-page-reordering */
export function AccentColorSection() {
  const { t } = useTranslation();
  const {
    accentColor,
    setAccentColor,
    colorScheme,
    customAccentLight,
    customAccentDark,
    setCustomAccentColors,
  } = useTheme();

  const [customLightInput, setCustomLightInput] = useState(customAccentLight);
  const [customDarkInput, setCustomDarkInput] = useState(customAccentDark);

  const handleColorSelect = (color: AccentColor): void => {
    void setAccentColor(color);
  };

  const handleCustomColorChange = useCallback(
    (lightHex: string, darkHex: string) => {
      setCustomLightInput(lightHex);
      setCustomDarkInput(darkHex);
      void setCustomAccentColors(lightHex, darkHex);
    },
    [setCustomAccentColors],
  );

  return (
    <section data-testid="settings-accent-color" className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
        {t("settings.accentColor")}
        <SyncIndicator settingKey="accent_color" />
      </h2>
      <div className="flex gap-4">
        {ACCENT_COLORS.map((color) => {
          if (color === "custom") {
            const isSelected = accentColor === "custom";
            return (
              <button
                key="custom"
                data-testid="settings-color-option-custom"
                aria-pressed={isSelected}
                aria-label={t("color.custom")}
                onClick={() => handleColorSelect("custom")}
                className={cn(
                  "w-9 h-9 rounded-full transition-all overflow-hidden",
                  isSelected && "ring-2 ring-offset-2 ring-gray-400 scale-110",
                )}
              >
                <div className="flex h-full">
                  <div
                    className="w-1/2 h-full"
                    style={{ backgroundColor: customLightInput }}
                  />
                  <div
                    className="w-1/2 h-full"
                    style={{ backgroundColor: customDarkInput }}
                  />
                </div>
              </button>
            );
          }

          const isSelected = accentColor === color;
          const isDarkTheme =
            colorScheme === "dark" ||
            (colorScheme === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);
          const colorValue = isDarkTheme
            ? ACCENT_COLOR_VALUES_DARK[color]
            : ACCENT_COLOR_VALUES[color];

          return (
            <button
              key={color}
              data-testid={`settings-color-option-${color}`}
              aria-pressed={isSelected}
              aria-label={t(`color.${color}`)}
              onClick={() => handleColorSelect(color)}
              className={cn(
                "w-9 h-9 rounded-full transition-all",
                isSelected && "ring-2 ring-offset-2 ring-gray-400 scale-110",
              )}
              style={{ backgroundColor: colorValue }}
            />
          );
        })}
      </div>

      {/* Custom color picker — shown only when custom is selected */}
      {accentColor === "custom" && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Light theme color */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            <Sun className="w-4 h-4 text-gray-500" />
            <input
              type="color"
              value={customLightInput}
              onChange={(e) =>
                handleCustomColorChange(e.target.value, customDarkInput)
              }
              className="w-8 h-8 border-0 cursor-pointer"
              data-testid="settings-custom-light-picker"
            />
            <input
              type="text"
              value={customLightInput}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  setCustomLightInput(value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    handleCustomColorChange(value, customDarkInput);
                  }
                }
              }}
              className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
              placeholder="#000000"
              data-testid="settings-custom-light-input"
            />
          </div>

          {/* Dark theme color */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
            <Moon className="w-4 h-4 text-gray-500" />
            <input
              type="color"
              value={customDarkInput}
              onChange={(e) =>
                handleCustomColorChange(customLightInput, e.target.value)
              }
              className="w-8 h-8 border-0 cursor-pointer"
              data-testid="settings-custom-dark-picker"
            />
            <input
              type="text"
              value={customDarkInput}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  setCustomDarkInput(value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    handleCustomColorChange(customLightInput, value);
                  }
                }
              }}
              className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
              placeholder="#000000"
              data-testid="settings-custom-dark-input"
            />
          </div>
        </div>
      )}
    </section>
  );
}
