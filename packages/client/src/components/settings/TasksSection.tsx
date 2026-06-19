import { useTranslation } from "react-i18next";
import { DayBoundarySection } from "@/components/settings/DayBoundarySection";
import { BOX_ICONS } from "@/components/tasks/taskEditShared";
import { OpacityBars } from "@/components/ui/OpacityBars";
import { BOX_ORDER, FOCUS_OPACITY_LEVELS } from "@/constants";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/shared/lib/cn";
import type { Box } from "@/types/common";
import { SyncIndicator } from "./SyncIndicator";

/** Implements FR4 of settings-page-reordering */
export function TasksSection() {
  const { t } = useTranslation();
  const { defaultBox, setDefaultBox, dayBoundary, setDayBoundary } =
    useSettings();
  const { isFocusMode, setFocusMode, focusOpacity, setFocusOpacity } =
    useFocusMode();

  const handleBoxSelect = (box: Box): void => {
    void setDefaultBox(box);
  };

  return (
    <div className="space-y-6">
      {/* Default box section */}
      <section data-testid="settings-default-box" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
          {t("settings.defaultBox")}
          <SyncIndicator settingKey="default_box" />
        </h2>
        <div className="flex gap-4">
          {BOX_ORDER.map((box) => {
            const BoxIcon = BOX_ICONS[box];
            const isSelected = defaultBox === box;
            return (
              <button
                key={box}
                data-testid={`settings-box-option-${box}`}
                aria-label={t(`box.${box}`)}
                aria-pressed={isSelected}
                onClick={() => handleBoxSelect(box)}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-full transition-colors",
                  isSelected
                    ? "text-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                )}
              >
                <BoxIcon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Day boundary section — implements FR10, UX2 of day-boundary */}
      <DayBoundarySection
        dayBoundary={dayBoundary}
        onDayBoundaryChange={(value) => void setDayBoundary(value)}
        syncIndicator={<SyncIndicator settingKey="day_boundary" />}
      />

      <hr className="border-gray-200" />

      {/* Focus mode section */}
      <section data-testid="settings-focus-mode">
        <button
          type="button"
          role="switch"
          aria-checked={isFocusMode}
          data-testid="settings-focus-mode-toggle"
          onClick={() => setFocusMode(!isFocusMode)}
          className="flex items-center gap-3"
        >
          <span
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
              isFocusMode ? "bg-accent" : "bg-gray-200",
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                isFocusMode ? "translate-x-5" : "translate-x-0",
              )}
            />
          </span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {t("settings.focusMode")}
          </span>
        </button>
        {isFocusMode && (
          <div className="mt-3" data-testid="settings-focus-opacity">
            <OpacityBars
              value={focusOpacity}
              onChange={setFocusOpacity}
              levels={FOCUS_OPACITY_LEVELS}
            />
          </div>
        )}
      </section>
    </div>
  );
}
