/**
 * Hook that manages sidebar hover-expand behavior with debounced timers.
 * Active only when effectiveState === 'hover-ready'.
 *
 * Implements FR5, FR6 of improve-sidebar-ux.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SIDEBAR_HOVER_CLOSE_DELAY_MS,
  SIDEBAR_HOVER_OPEN_DELAY_MS,
} from "@/constants";
import type { SidebarEffectiveState } from "@/types/common";

export interface UseSidebarHoverReturn {
  isHoverExpanded: boolean;
  hoverHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

export function useSidebarHover(
  effectiveState: SidebarEffectiveState,
): UseSidebarHoverReturn {
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHoverReady = effectiveState === "hover-ready";

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const onMouseEnter = useCallback(() => {
    if (!isHoverReady) return;

    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    openTimerRef.current = setTimeout(() => {
      setIsHoverExpanded(true);
      openTimerRef.current = null;
    }, SIDEBAR_HOVER_OPEN_DELAY_MS);
  }, [isHoverReady]);

  const onMouseLeave = useCallback(() => {
    if (!isHoverReady) return;

    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    closeTimerRef.current = setTimeout(() => {
      setIsHoverExpanded(false);
      closeTimerRef.current = null;
    }, SIDEBAR_HOVER_CLOSE_DELAY_MS);
  }, [isHoverReady]);

  // Reset state and clear timers when leaving hover-ready
  useEffect(() => {
    if (!isHoverReady) {
      clearTimers();
      setIsHoverExpanded(false);
    }
  }, [isHoverReady, clearTimers]);

  // Clean up timers on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    isHoverExpanded: isHoverReady && isHoverExpanded,
    hoverHandlers: { onMouseEnter, onMouseLeave },
  };
}
