import { PanelLeft, PanelRight } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { MenuOrderSection } from "@/components/settings/MenuOrderSection";
import {
  FILTER_BAR_POSITIONS,
  HANDEDNESS_OPTIONS,
  PANEL_SIDES,
} from "@/constants";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useHandedness } from "@/hooks/useHandedness";
import { usePanelAlwaysOpen } from "@/hooks/usePanelAlwaysOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { cn } from "@/shared/lib/cn";
import type { FilterBarPosition, Handedness, PanelSide } from "@/types/common";

const PANEL_SIDE_ICONS: Record<PanelSide, React.FC<{ className?: string }>> = {
  left: ({ className }) => <PanelLeft className={className} />,
  right: ({ className }) => <PanelRight className={className} />,
};

/** Implements FR3 of settings-page-reordering */
export function WorkspaceSection() {
  const { t } = useTranslation();
  const { panelSide, setPanelSide } = usePanelSide();
  const { isPanelAlwaysOpen, setPanelAlwaysOpen } = usePanelAlwaysOpen();
  const { isDetailPanelPinned, setDetailPanelPinned } = useDetailPanelPinned();
  const { handedness, setHandedness } = useHandedness();
  const { filterBarPosition, setFilterBarPosition } = useFilterBarPosition();

  const handlePanelSideSelect = (side: PanelSide): void => {
    setPanelSide(side);
  };

  const handleFilterBarPositionSelect = (position: FilterBarPosition): void => {
    setFilterBarPosition(position);
  };

  const handleHandednessSelect = (value: Handedness): void => {
    setHandedness(value);
  };

  return (
    <div className="space-y-6">
      {/* Panel side section */}
      <section data-testid="settings-panel-side" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("settings.panelSide")}
        </h2>
        <div className="flex gap-4">
          {PANEL_SIDES.map((side) => {
            const PanelIcon = PANEL_SIDE_ICONS[side];
            const isSelected = panelSide === side;
            return (
              <button
                key={side}
                data-testid={`settings-panel-side-option-${side}`}
                aria-label={
                  side === "left"
                    ? t("settings.panelLeft")
                    : t("settings.panelRight")
                }
                aria-pressed={isSelected}
                onClick={() => handlePanelSideSelect(side)}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-full transition-colors",
                  isSelected
                    ? "text-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                )}
              >
                <PanelIcon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Panel always open section */}
      <section data-testid="settings-panel-always-open">
        <button
          type="button"
          role="switch"
          aria-checked={isPanelAlwaysOpen}
          data-testid="settings-panel-always-open-toggle"
          onClick={() => setPanelAlwaysOpen(!isPanelAlwaysOpen)}
          className="flex items-center gap-3"
        >
          <span
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
              isPanelAlwaysOpen ? "bg-accent" : "bg-gray-200",
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                isPanelAlwaysOpen ? "translate-x-5" : "translate-x-0",
              )}
            />
          </span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {t("settings.panelAlwaysOpen")}
          </span>
        </button>
      </section>

      {/* Detail panel pinned section — implements FR7 of pin-task-detail-panel */}
      <section data-testid="settings-detail-panel-pinned">
        <button
          type="button"
          role="switch"
          aria-checked={isDetailPanelPinned}
          data-testid="settings-detail-panel-pinned-toggle"
          onClick={() => setDetailPanelPinned(!isDetailPanelPinned)}
          className="flex items-center gap-3"
        >
          <span
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
              isDetailPanelPinned ? "bg-accent" : "bg-gray-200",
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                isDetailPanelPinned ? "translate-x-5" : "translate-x-0",
              )}
            />
          </span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {t("settings.detailPanelPinned")}
          </span>
        </button>
      </section>

      {/* Handedness section */}
      <section data-testid="settings-handedness" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("settings.handedness")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {HANDEDNESS_OPTIONS.map((option) => (
            <button
              key={option}
              data-testid={`settings-handedness-option-${option}`}
              aria-pressed={handedness === option}
              onClick={() => handleHandednessSelect(option)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                handedness === option
                  ? "bg-accent border-accent text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
              )}
            >
              {option === "right"
                ? t("settings.handednessRight")
                : t("settings.handednessLeft")}
            </button>
          ))}
        </div>
      </section>

      {/* Filter bar position section */}
      <section data-testid="settings-filter-bar-position" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("settings.filterBarPosition")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {FILTER_BAR_POSITIONS.map((position) => (
            <button
              key={position}
              data-testid={`settings-filter-bar-position-option-${position}`}
              aria-pressed={filterBarPosition === position}
              onClick={() => handleFilterBarPositionSelect(position)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                filterBarPosition === position
                  ? "bg-accent border-accent text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
              )}
            >
              {position === "bottom"
                ? t("settings.filterBarBottom")
                : t("settings.filterBarTop")}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Menu order section */}
      <MenuOrderSection />
    </div>
  );
}
