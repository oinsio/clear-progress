import {
  BookOpen,
  CheckCheck,
  CheckSquare,
  Crosshair,
  Inbox,
  Lightbulb,
  MapPin,
  Tag,
  Target,
  Trash2,
} from "lucide-react";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants";
import { useMenuOrder } from "@/hooks/useMenuOrder";
import { cn } from "@/shared/lib/cn";
import type { MenuMode, PanelSide } from "@/types/common";
import { SidebarFilterNav } from "./SidebarFilterNav";
import { SidebarSyncBlock } from "./SidebarSyncBlock";

export type SidebarMode =
  | "inbox"
  | "tasks"
  | "completed"
  | "goals"
  | "focused_goals"
  | "ideas"
  | "contexts"
  | "categories"
  | "memos"
  | "deleted"
  | "search"
  | null;

export interface FilterItem {
  mode: MenuMode;
  labelKey: string;
  Icon: React.ElementType;
  route?: string;
}

export const FILTER_ITEMS: FilterItem[] = [
  { mode: "inbox", labelKey: "filter.inbox", Icon: Inbox, route: ROUTES.INBOX },
  {
    mode: "contexts",
    labelKey: "filter.contexts",
    Icon: MapPin,
    route: ROUTES.CONTEXTS,
  },
  {
    mode: "categories",
    labelKey: "filter.categories",
    Icon: Tag,
    route: ROUTES.CATEGORIES,
  },
  {
    mode: "goals",
    labelKey: "filter.goals",
    Icon: Target,
    route: ROUTES.GOALS,
  },
  {
    mode: "focused_goals",
    labelKey: "filter.focused_goals",
    Icon: Crosshair,
  },
  {
    mode: "ideas",
    labelKey: "filter.ideas",
    Icon: Lightbulb,
    route: ROUTES.IDEAS,
  },
  {
    mode: "tasks",
    labelKey: "filter.tasks",
    Icon: CheckSquare,
    route: ROUTES.TASKS,
  },
  {
    mode: "completed",
    labelKey: "filter.completed",
    Icon: CheckCheck,
    route: ROUTES.COMPLETED,
  },
  {
    mode: "memos",
    labelKey: "filter.memos",
    Icon: BookOpen,
    route: ROUTES.MEMOS,
  },
  {
    mode: "deleted",
    labelKey: "filter.deleted",
    Icon: Trash2,
    route: ROUTES.DELETED,
  },
];

const FILTER_ITEMS_MAP: Record<MenuMode, FilterItem> = Object.fromEntries(
  FILTER_ITEMS.map((item) => [item.mode, item]),
) as Record<MenuMode, FilterItem>;

export interface SidebarProps {
  mode: SidebarMode;
  isOpen: boolean;
  side?: PanelSide;
  activeFocusedGoalId?: string;
  containerRef?: React.Ref<HTMLDivElement>;
  sidebarTranslateX?: number;
  onToggle: () => void;
  onCollapsedClick?: () => void;
  onAutoCollapse?: () => void;
  onModeChange: (mode: SidebarMode) => void;
}

/**
 * Main sidebar component — thin orchestrator composing SidebarSyncBlock and SidebarFilterNav.
 *
 * Implements FR1 of rename-right-panel-to-sidebar.
 * Implements FR4, FR5 of improve-sidebar-ux.
 */
export function Sidebar({
  mode,
  isOpen,
  side = "right",
  activeFocusedGoalId,
  containerRef,
  sidebarTranslateX = 0,
  onToggle,
  onCollapsedClick,
  onAutoCollapse,
  onModeChange,
}: SidebarProps) {
  const { t } = useTranslation();
  const { menuOrder } = useMenuOrder();

  const visibleFilterItems = menuOrder
    .filter((config) => config.visible)
    .map((config) => FILTER_ITEMS_MAP[config.mode]);

  const isLeft = side === "left";
  const panelBorder = isLeft
    ? "border-r border-accent/70"
    : "border-l border-accent/70";

  if (isOpen) {
    return (
      <div
        className={cn(
          "flex flex-shrink-0",
          isLeft && "order-first flex-row-reverse",
        )}
      >
        {/* Mobile backdrop overlay — implements FR8 of improve-sidebar-ux */}
        <div
          data-testid="sidebar-backdrop"
          className="md:hidden fixed inset-0 bg-black/40 z-10"
          aria-label={t("filter.closeSidebar")}
          role="button"
          tabIndex={-1}
          onClick={onToggle}
        />
        {/* Mobile placeholder: keeps flex layout stable while panel is an overlay */}
        <div
          className={cn("md:hidden w-14 flex-shrink-0 bg-accent", panelBorder)}
        />
        <div
          ref={containerRef}
          className={cn(
            "w-52 flex flex-col bg-accent overflow-hidden",
            "absolute top-0 bottom-0 z-20 md:relative md:z-auto",
            isLeft ? "left-0" : "right-0",
            panelBorder,
          )}
          style={
            sidebarTranslateX !== 0
              ? { transform: `translateX(${sidebarTranslateX}px)` }
              : undefined
          }
          data-testid="sidebar-expanded"
        >
          <SidebarSyncBlock isExpanded={true} side={side} onToggle={onToggle} />
          <SidebarFilterNav
            isExpanded={true}
            mode={mode}
            activeFocusedGoalId={activeFocusedGoalId}
            visibleFilterItems={visibleFilterItems}
            onModeChange={onModeChange}
            onAutoCollapse={onAutoCollapse}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-shrink-0",
        isLeft && "order-first flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "w-14 flex flex-col items-center bg-accent overflow-hidden cursor-pointer",
          onCollapsedClick && "[&_button]:pointer-events-none",
          panelBorder,
        )}
        onClick={onCollapsedClick ?? onToggle}
        data-testid="sidebar-toggle"
        aria-label={t("filter.open")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && (onCollapsedClick ?? onToggle)()}
      >
        <SidebarSyncBlock isExpanded={false} side={side} />
        <SidebarFilterNav
          isExpanded={false}
          mode={mode}
          activeFocusedGoalId={activeFocusedGoalId}
          visibleFilterItems={visibleFilterItems}
          onModeChange={onModeChange}
        />
      </div>
    </div>
  );
}
