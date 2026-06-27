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
import {
  ROUTES,
  SIDEBAR_DRAWER_TRANSITION_MS,
  SIDEBAR_EXPANDED_WIDTH_PX,
  SIDEBAR_HOVER_TRANSITION_MS,
} from "@/constants";
import { useMenuOrder } from "@/hooks/useMenuOrder";
import { cn } from "@/shared/lib/cn";
import type {
  MenuMode,
  PanelSide,
  SidebarMode as SidebarBehaviorMode,
  SidebarEffectiveState,
} from "@/types/common";
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
  effectiveState: SidebarEffectiveState;
  isDrawerOpen: boolean;
  isHoverExpanded?: boolean;
  hoverHandlers?: { onMouseEnter: () => void; onMouseLeave: () => void };
  side?: PanelSide;
  activeFocusedGoalId?: string;
  containerRef?: React.Ref<HTMLDivElement>;
  sidebarTranslateX?: number;
  onAutoCollapse?: () => void;
  onModeChange: (mode: SidebarMode) => void;
  sidebarBehaviorMode?: SidebarBehaviorMode;
  onSidebarBehaviorModeChange?: (mode: SidebarBehaviorMode) => void;
  isControlVisible?: boolean;
  isMobileDrawer?: boolean;
  isSwiping?: boolean;
}

/**
 * Main sidebar component — thin orchestrator composing SidebarSyncBlock and SidebarFilterNav.
 *
 * Implements FR1 of rename-right-panel-to-sidebar.
 * Implements FR4, FR5 of improve-sidebar-ux.
 */
export function Sidebar({
  mode,
  effectiveState,
  isDrawerOpen,
  isHoverExpanded = false,
  hoverHandlers,
  side = "right",
  activeFocusedGoalId,
  containerRef,
  sidebarTranslateX = 0,
  onAutoCollapse,
  onModeChange,
  sidebarBehaviorMode,
  onSidebarBehaviorModeChange,
  isControlVisible = false,
  isMobileDrawer = false,
  isSwiping = false,
}: SidebarProps) {
  const { menuOrder } = useMenuOrder();

  const visibleFilterItems = menuOrder
    .filter((config) => config.visible)
    .map((config) => FILTER_ITEMS_MAP[config.mode]);

  const isLeft = side === "left";
  const panelBorder = isLeft
    ? "border-r border-accent/70"
    : "border-l border-accent/70";

  const isHoverReady = effectiveState === "hover-ready";

  const isExpanded = effectiveState === "expanded" || isDrawerOpen;

  // Mobile drawer: collapsed bar always visible + expanded overlay always in DOM
  if (isMobileDrawer) {
    const offScreenX = isLeft
      ? -SIDEBAR_EXPANDED_WIDTH_PX
      : SIDEBAR_EXPANDED_WIDTH_PX;
    const targetX = isDrawerOpen ? 0 : offScreenX;
    const drawerTranslateX =
      isSwiping && sidebarTranslateX !== 0 ? sidebarTranslateX : targetX;

    return (
      <div
        className={cn(
          "flex flex-shrink-0",
          isLeft && "order-first flex-row-reverse",
        )}
      >
        {/* Collapsed bar — always visible */}
        <div
          className={cn(
            "w-14 flex flex-col items-center bg-accent",
            panelBorder,
          )}
          data-testid="sidebar-collapsed"
        >
          <SidebarSyncBlock isExpanded={false} side={side} />
          <SidebarFilterNav
            isExpanded={false}
            mode={mode}
            activeFocusedGoalId={activeFocusedGoalId}
            visibleFilterItems={visibleFilterItems}
            onModeChange={onModeChange}
            side={side}
            sidebarBehaviorMode={sidebarBehaviorMode}
            onSidebarBehaviorModeChange={onSidebarBehaviorModeChange}
            isControlVisible={isControlVisible}
          />
        </div>
        {/* Expanded overlay — always in DOM, animated via transform */}
        <div
          ref={containerRef}
          className={cn(
            "w-52 flex flex-col bg-accent overflow-hidden",
            "absolute top-0 bottom-0 z-20",
            isLeft ? "left-0" : "right-0",
            panelBorder,
          )}
          style={{
            transform: `translateX(${drawerTranslateX}px)`,
            transition: isSwiping
              ? "none"
              : `transform ${SIDEBAR_DRAWER_TRANSITION_MS}ms ease-out`,
          }}
          data-testid="sidebar-expanded"
          aria-hidden={!isDrawerOpen && !isSwiping}
        >
          <SidebarSyncBlock isExpanded={true} side={side} />
          <SidebarFilterNav
            isExpanded={true}
            mode={mode}
            activeFocusedGoalId={activeFocusedGoalId}
            visibleFilterItems={visibleFilterItems}
            onModeChange={onModeChange}
            onAutoCollapse={onAutoCollapse}
            side={side}
            sidebarBehaviorMode={sidebarBehaviorMode}
            onSidebarBehaviorModeChange={onSidebarBehaviorModeChange}
            isControlVisible={isControlVisible}
          />
        </div>
      </div>
    );
  }

  // Hover-ready state: collapsed sidebar + animated overlay
  if (isHoverReady) {
    const overlayTranslateX = isHoverExpanded ? 0 : isLeft ? -208 : 208;

    return (
      <div
        className={cn(
          "flex flex-shrink-0",
          isLeft && "order-first flex-row-reverse",
        )}
        {...hoverHandlers}
      >
        {/* Collapsed sidebar — always visible */}
        <div
          className={cn(
            "w-14 flex flex-col items-center bg-accent",
            panelBorder,
          )}
          data-testid="sidebar-collapsed"
        >
          <SidebarSyncBlock isExpanded={false} side={side} />
          <SidebarFilterNav
            isExpanded={false}
            mode={mode}
            activeFocusedGoalId={activeFocusedGoalId}
            visibleFilterItems={visibleFilterItems}
            onModeChange={onModeChange}
            side={side}
            sidebarBehaviorMode={sidebarBehaviorMode}
            onSidebarBehaviorModeChange={onSidebarBehaviorModeChange}
            isControlVisible={isControlVisible}
          />
        </div>
        {/* Hover overlay — always in DOM, animated via transform */}
        <div
          ref={containerRef}
          className={cn(
            "w-52 flex flex-col bg-accent overflow-hidden",
            "absolute top-0 bottom-0 z-30",
            isLeft ? "left-0" : "right-0",
            panelBorder,
          )}
          style={{
            transform: `translateX(${overlayTranslateX}px)`,
            transition: `transform ${SIDEBAR_HOVER_TRANSITION_MS}ms ease-out`,
          }}
          data-testid="sidebar-hover-expanded"
          aria-hidden={!isHoverExpanded}
        >
          <SidebarSyncBlock isExpanded={true} side={side} />
          <SidebarFilterNav
            isExpanded={true}
            mode={mode}
            activeFocusedGoalId={activeFocusedGoalId}
            visibleFilterItems={visibleFilterItems}
            onModeChange={onModeChange}
            side={side}
            sidebarBehaviorMode={sidebarBehaviorMode}
            onSidebarBehaviorModeChange={onSidebarBehaviorModeChange}
            isControlVisible={isControlVisible}
          />
        </div>
      </div>
    );
  }

  if (isExpanded) {
    return (
      <div
        className={cn(
          "flex flex-shrink-0",
          isLeft && "order-first flex-row-reverse",
        )}
      >
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
          <SidebarSyncBlock isExpanded={true} side={side} />
          <SidebarFilterNav
            isExpanded={true}
            mode={mode}
            activeFocusedGoalId={activeFocusedGoalId}
            visibleFilterItems={visibleFilterItems}
            onModeChange={onModeChange}
            onAutoCollapse={onAutoCollapse}
            side={side}
            sidebarBehaviorMode={sidebarBehaviorMode}
            onSidebarBehaviorModeChange={onSidebarBehaviorModeChange}
            isControlVisible={isControlVisible}
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
        className={cn("w-14 flex flex-col items-center bg-accent", panelBorder)}
        data-testid="sidebar-collapsed"
      >
        <SidebarSyncBlock isExpanded={false} side={side} />
        <SidebarFilterNav
          isExpanded={false}
          mode={mode}
          activeFocusedGoalId={activeFocusedGoalId}
          visibleFilterItems={visibleFilterItems}
          onModeChange={onModeChange}
          side={side}
          sidebarBehaviorMode={sidebarBehaviorMode}
          onSidebarBehaviorModeChange={onSidebarBehaviorModeChange}
          isControlVisible={isControlVisible}
        />
      </div>
    </div>
  );
}
