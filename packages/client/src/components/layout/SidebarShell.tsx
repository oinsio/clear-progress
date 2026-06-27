/**
 * Shared layout component that provides full sidebar integration
 * (hover, swipe, drawer, backdrop, control) for all pages.
 *
 * Replaces duplicated sidebar logic across individual page components.
 */
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { SIDEBAR_DRAWER_TRANSITION_MS } from "@/constants";
import { useSidebarDrawer } from "@/hooks/useSidebarDrawer";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { Sidebar, type SidebarMode } from "../tasks/Sidebar";

export interface SidebarShellProps {
  mode: SidebarMode;
  children: React.ReactNode;
  onModeChange?: (mode: SidebarMode) => void;
  activeFocusedGoalId?: string;
  "data-testid"?: string;
}

export function SidebarShell({
  mode,
  children,
  onModeChange: externalModeChange,
  activeFocusedGoalId,
  "data-testid": dataTestId,
}: SidebarShellProps) {
  const { t } = useTranslation();
  const {
    panelSide,
    effectiveState,
    sidebarBehaviorMode,
    setSidebarBehaviorMode,
    isNarrow,
    hasHover,
    isDrawerOpen,
    closeDrawer,
    sidebarRef,
    isMobileDrawer,
    sidebarTranslateX,
    isSwiping,
    isHoverExpanded,
    hoverHandlers,
    handleAutoCollapse,
  } = useSidebarDrawer();

  const defaultModeChange = useSidebarNavigation();
  const handleModeChange = externalModeChange ?? defaultModeChange;

  return (
    <div
      data-testid={dataTestId}
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {children}

      {/* Backdrop for drawer mode — always in DOM for animation */}
      {isMobileDrawer && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 z-10"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${isDrawerOpen ? 0.4 : 0})`,
            transition: `background-color ${SIDEBAR_DRAWER_TRANSITION_MS}ms ease-out`,
            pointerEvents: isDrawerOpen ? "auto" : "none",
          }}
          aria-label={t("filter.closeSidebar")}
          role="button"
          tabIndex={-1}
          onClick={closeDrawer}
        />
      )}

      <Sidebar
        mode={mode}
        effectiveState={effectiveState}
        isDrawerOpen={isDrawerOpen}
        isHoverExpanded={isHoverExpanded}
        hoverHandlers={hoverHandlers}
        side={panelSide}
        containerRef={sidebarRef}
        sidebarTranslateX={sidebarTranslateX}
        onAutoCollapse={handleAutoCollapse}
        onModeChange={handleModeChange}
        sidebarBehaviorMode={sidebarBehaviorMode}
        onSidebarBehaviorModeChange={setSidebarBehaviorMode}
        isControlVisible={!isNarrow || hasHover}
        isMobileDrawer={isMobileDrawer}
        isSwiping={isSwiping}
        activeFocusedGoalId={activeFocusedGoalId}
      />
    </div>
  );
}
