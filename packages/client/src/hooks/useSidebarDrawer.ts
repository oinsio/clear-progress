/**
 * Implements FR8, FR14-FR17 of improve-sidebar-ux.
 *
 * Encapsulates shared sidebar drawer state: open/close, swipe gestures,
 * hover expansion, auto-collapse, and close-on-widen behavior.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarHover } from "@/hooks/useSidebarHover";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useSidebarSwipe } from "@/hooks/useSidebarSwipe";

export function useSidebarDrawer() {
  const { panelSide } = usePanelSide();
  const {
    effectiveState,
    sidebarMode: sidebarBehaviorMode,
    setSidebarMode: setSidebarBehaviorMode,
    isNarrow,
    hasHover,
  } = useSidebarState();

  // FR14-FR17: Drawer state for mobile (narrow + no hover)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobileDrawer = isNarrow && !hasHover;

  const { sidebarTranslateX, isSwiping } = useSidebarSwipe({
    sidebarRef,
    side: panelSide,
    isOpen: isDrawerOpen,
    isDesktop: !isNarrow || hasHover,
    onOpen: openDrawer,
    onClose: closeDrawer,
  });

  const { isHoverExpanded, hoverHandlers } = useSidebarHover(effectiveState);

  // FR11: Auto-collapse only when drawer is open
  const handleAutoCollapse = isDrawerOpen ? closeDrawer : undefined;

  // FR17: Close drawer when transitioning from narrow to wide
  useEffect(() => {
    if (!isNarrow) {
      setIsDrawerOpen(false);
    }
  }, [isNarrow]);

  return {
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
  };
}
