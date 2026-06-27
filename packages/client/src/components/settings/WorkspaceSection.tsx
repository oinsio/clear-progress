import { PanelLeft, PanelRight, Pin } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { MenuOrderSection } from "@/components/settings/MenuOrderSection";
import {
  FILTER_BAR_POSITIONS,
  HANDEDNESS_OPTIONS,
  PANEL_SIDES,
  SIDEBAR_MODE_I18N_KEYS,
  SIDEBAR_MODES,
} from "@/constants";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useHandedness } from "@/hooks/useHandedness";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarMode } from "@/hooks/useSidebarMode";
import { cn } from "@/shared/lib/cn";
import type {
  FilterBarPosition,
  Handedness,
  PanelSide,
  SidebarMode,
} from "@/types/common";

const PANEL_SIDE_ICONS: Record<PanelSide, React.FC<{ className?: string }>> = {
  left: ({ className }) => <PanelLeft className={className} />,
  right: ({ className }) => <PanelRight className={className} />,
};

/** Implements FR3 of settings-page-reordering */
export function WorkspaceSection() {
  const { t } = useTranslation();
  const { panelSide, setPanelSide } = usePanelSide();
  const { isDetailPanelPinned, setDetailPanelPinned } = useDetailPanelPinned();
  const { handedness, setHandedness } = useHandedness();
  const { filterBarPosition, setFilterBarPosition } = useFilterBarPosition();
  const [sidebarMode, setSidebarMode] = useSidebarMode();

  const handlePanelSideSelect = (side: PanelSide): void => {
    setPanelSide(side);
  };

  const handleFilterBarPositionSelect = (position: FilterBarPosition): void => {
    setFilterBarPosition(position);
  };

  const handleHandednessSelect = (value: Handedness): void => {
    setHandedness(value);
  };

  const handleSidebarModeSelect = (mode: SidebarMode): void => {
    setSidebarMode(mode);
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

      {/* Detail panel pinned section — implements FR7 of pin-task-detail-panel, FR11 of improve-sidebar-ux */}
      <section data-testid="settings-detail-panel-pinned">
        <button
          type="button"
          aria-label={
            isDetailPanelPinned
              ? t("settings.unpinDetailPanel")
              : t("settings.pinDetailPanel")
          }
          aria-pressed={isDetailPanelPinned}
          data-testid="settings-detail-panel-pinned-toggle"
          onClick={() => setDetailPanelPinned(!isDetailPanelPinned)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
            isDetailPanelPinned
              ? "text-accent"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
          )}
        >
          <Pin
            className={cn(
              "w-5 h-5 flex-shrink-0",
              isDetailPanelPinned ? "fill-current" : "rotate-45",
            )}
          />
          <span className="text-sm font-medium">
            {isDetailPanelPinned
              ? t("settings.unpinDetailPanel")
              : t("settings.pinDetailPanel")}
          </span>
        </button>
      </section>

      {/* Sidebar mode section — implements FR3 of improve-sidebar-ux */}
      <section data-testid="settings-sidebar-mode" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("sidebar.control")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SIDEBAR_MODES.map((modeOption) => (
            <button
              key={modeOption}
              data-testid={`settings-sidebar-mode-option-${modeOption}`}
              aria-pressed={sidebarMode === modeOption}
              onClick={() => handleSidebarModeSelect(modeOption)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                sidebarMode === modeOption
                  ? "bg-accent border-accent text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
              )}
            >
              {t(SIDEBAR_MODE_I18N_KEYS[modeOption])}
            </button>
          ))}
        </div>
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
