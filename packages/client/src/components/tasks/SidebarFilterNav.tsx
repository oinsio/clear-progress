import { PanelLeft, PanelRight, Search } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type {
  PanelSide,
  SidebarMode as SidebarBehaviorMode,
} from "@/types/common";
import { FocusedGoalsBlock } from "./FocusedGoalsBlock";
import type { FilterItem, SidebarMode } from "./Sidebar";
import { SidebarControlPopover } from "./SidebarControlPopover";

interface SidebarFilterNavProps {
  isExpanded: boolean;
  mode: SidebarMode;
  activeFocusedGoalId?: string;
  visibleFilterItems: FilterItem[];
  onModeChange: (mode: SidebarMode) => void;
  onAutoCollapse?: () => void;
  side?: PanelSide;
  sidebarBehaviorMode?: SidebarBehaviorMode;
  onSidebarBehaviorModeChange?: (mode: SidebarBehaviorMode) => void;
  isControlVisible?: boolean;
}

/**
 * Filter items navigation list for the sidebar.
 * Renders expanded (icon + text labels) or collapsed (icon-only) variant.
 *
 * Implements FR5 of rename-right-panel-to-sidebar.
 * Implements FR6 of improve-sidebar-ux.
 */
export function SidebarFilterNav({
  isExpanded,
  mode,
  activeFocusedGoalId,
  visibleFilterItems,
  onModeChange,
  onAutoCollapse,
  side = "right",
  sidebarBehaviorMode,
  onSidebarBehaviorModeChange,
  isControlVisible = false,
}: SidebarFilterNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleTogglePopover = useCallback(() => {
    setIsPopoverOpen((previous) => !previous);
  }, []);

  const handleClosePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  const PanelIcon = side === "left" ? PanelLeft : PanelRight;

  const handleFilterClick = (
    _event: React.MouseEvent,
    filterItem: FilterItem,
  ): void => {
    if (filterItem.route) {
      navigate(filterItem.route);
    } else {
      const isActive = mode === filterItem.mode;
      onModeChange(isActive ? null : filterItem.mode);
    }
    onAutoCollapse?.();
  };

  const handleSearchClick = (): void => {
    navigate(ROUTES.SEARCH);
    onAutoCollapse?.();
  };

  if (isExpanded) {
    return (
      <>
        <nav
          className="flex-1 px-2 py-2 overflow-y-auto"
          aria-label={t("filter.open")}
        >
          {visibleFilterItems.map((filterItem) =>
            renderExpandedFilterItem(
              filterItem,
              mode,
              activeFocusedGoalId,
              handleFilterClick,
              t,
            ),
          )}
        </nav>
        {isControlVisible &&
          sidebarBehaviorMode &&
          onSidebarBehaviorModeChange && (
            <div
              className={cn(
                "relative px-2 py-1 flex items-center",
                side === "right" && "justify-end",
              )}
            >
              <button
                type="button"
                aria-label={t("sidebar.control")}
                data-testid="sidebar-control-trigger"
                onClick={handleTogglePopover}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-white/70 hover:bg-white/10 hover:text-white"
              >
                <PanelIcon className="w-5 h-5" aria-hidden="true" />
              </button>
              <SidebarControlPopover
                currentMode={sidebarBehaviorMode}
                onModeChange={onSidebarBehaviorModeChange}
                isOpen={isPopoverOpen}
                onClose={handleClosePopover}
                side={side}
              />
            </div>
          )}
        <div className="px-2 py-2 border-t border-white/25 flex flex-col gap-1">
          <button
            type="button"
            aria-label={t("filter.search")}
            data-testid="sidebar-filter-search"
            onClick={handleSearchClick}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-colors text-left text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Search className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span>{t("filter.search")}</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <nav
        className="flex-1 flex flex-col items-center gap-1 py-1 overflow-y-auto"
        aria-label={t("filter.open")}
      >
        {visibleFilterItems.map((filterItem) =>
          renderCollapsedFilterItem(
            filterItem,
            mode,
            activeFocusedGoalId,
            handleFilterClick,
            t,
          ),
        )}
      </nav>
      {isControlVisible &&
        sidebarBehaviorMode &&
        onSidebarBehaviorModeChange && (
          <div className="relative flex justify-center py-1">
            <button
              type="button"
              aria-label={t("sidebar.control")}
              data-testid="sidebar-control-trigger"
              onClick={handleTogglePopover}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-white/70 hover:bg-white/10 hover:text-white"
            >
              <PanelIcon className="w-5 h-5" aria-hidden="true" />
            </button>
            <SidebarControlPopover
              currentMode={sidebarBehaviorMode}
              onModeChange={onSidebarBehaviorModeChange}
              isOpen={isPopoverOpen}
              onClose={handleClosePopover}
              isCollapsed={true}
              side={side}
            />
          </div>
        )}
      <div className="flex flex-col items-center py-2 border-t border-white/25 gap-1">
        <button
          type="button"
          aria-label={t("filter.search")}
          data-testid="sidebar-filter-search"
          onClick={handleSearchClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function renderExpandedFilterItem(
  filterItem: FilterItem,
  mode: SidebarMode,
  activeFocusedGoalId: string | undefined,
  onFilterClick: (event: React.MouseEvent, filterItem: FilterItem) => void,
  t: (key: string) => string,
): React.JSX.Element {
  const { mode: itemMode, labelKey, Icon } = filterItem;

  if (itemMode === "focused_goals") {
    return (
      <FocusedGoalsBlock
        key={itemMode}
        isExpanded={true}
        activeGoalId={activeFocusedGoalId}
      />
    );
  }

  const isActive = mode === itemMode;
  const label = t(labelKey);

  return (
    <button
      key={itemMode}
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      data-testid={`sidebar-filter-${itemMode}`}
      onClick={(event) => onFilterClick(event, filterItem)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-left",
        isActive
          ? "bg-white/20 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function renderCollapsedFilterItem(
  filterItem: FilterItem,
  mode: SidebarMode,
  activeFocusedGoalId: string | undefined,
  onFilterClick: (event: React.MouseEvent, filterItem: FilterItem) => void,
  t: (key: string) => string,
): React.JSX.Element {
  const { mode: itemMode, labelKey, Icon } = filterItem;

  if (itemMode === "focused_goals") {
    return (
      <FocusedGoalsBlock
        key={itemMode}
        isExpanded={false}
        activeGoalId={activeFocusedGoalId}
      />
    );
  }

  const isActive = mode === itemMode;
  const label = t(labelKey);

  return (
    <button
      key={itemMode}
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      data-testid={`sidebar-filter-${itemMode}`}
      onClick={(event) => onFilterClick(event, filterItem)}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
        isActive
          ? "bg-white/20 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
