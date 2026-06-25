/**
 * Implements FR8, FR9, NFR-R2 of improve-sidebar-ux.
 *
 * Detects edge swipes to open/close the sidebar on mobile.
 * Returns a translateX value so the sidebar can follow the user's finger.
 */
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  SIDEBAR_SWIPE_EDGE_ZONE_PX,
  SIDEBAR_SWIPE_THRESHOLD_PERCENT,
} from "@/constants";
import type { PanelSide } from "@/types/common";

export interface UseSidebarSwipeOptions {
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  side: PanelSide;
  isOpen: boolean;
  isDesktop: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export interface UseSidebarSwipeReturn {
  sidebarTranslateX: number;
}

type SwipePhase = "idle" | "detecting" | "swiping";

export function useSidebarSwipe({
  sidebarRef,
  side,
  isOpen,
  isDesktop,
  onOpen,
  onClose,
}: UseSidebarSwipeOptions): UseSidebarSwipeReturn {
  const [sidebarTranslateX, setSidebarTranslateX] = useState(0);

  const openPhaseRef = useRef<SwipePhase>("idle");
  const openStartXRef = useRef(0);
  const openStartYRef = useRef(0);
  const openTranslateXRef = useRef(0);

  const closePhaseRef = useRef<SwipePhase>("idle");
  const closeStartXRef = useRef(0);
  const closeStartYRef = useRef(0);
  const closeTranslateXRef = useRef(0);

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Edge swipe to open (listens on document)
  useEffect(() => {
    if (isDesktop) return;

    function getSidebarWidth(): number {
      return sidebarRef.current?.offsetWidth ?? 0;
    }

    function isEdgeTouch(touchX: number): boolean {
      if (side === "right") {
        return window.innerWidth - touchX < SIDEBAR_SWIPE_EDGE_ZONE_PX;
      }
      return touchX < SIDEBAR_SWIPE_EDGE_ZONE_PX;
    }

    function handleTouchStart(event: TouchEvent) {
      if (isOpenRef.current) return;
      const touch = event.touches[0];
      if (!isEdgeTouch(touch.clientX)) return;

      openPhaseRef.current = "detecting";
      openStartXRef.current = touch.clientX;
      openStartYRef.current = touch.clientY;
      openTranslateXRef.current = 0;
    }

    function handleTouchMove(event: TouchEvent) {
      if (openPhaseRef.current === "idle") return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - openStartXRef.current;
      const deltaY = touch.clientY - openStartYRef.current;

      if (openPhaseRef.current === "detecting") {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absY > absX && absY > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2) {
          openPhaseRef.current = "idle";
          return;
        }

        if (absX > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2) {
          openPhaseRef.current = "swiping";
        } else {
          return;
        }
      }

      event.preventDefault();

      const sidebarWidth = getSidebarWidth();
      if (sidebarWidth === 0) return;

      // Opening: for right side, deltaX is negative (swiping left from edge)
      // translateX goes from +sidebarWidth (off-screen) toward 0 (visible)
      if (side === "right") {
        const progress = Math.min(Math.abs(deltaX), sidebarWidth);
        const currentTranslateX = sidebarWidth - progress;
        openTranslateXRef.current = currentTranslateX;
        setSidebarTranslateX(currentTranslateX);
      } else {
        const progress = Math.min(deltaX, sidebarWidth);
        const currentTranslateX =
          progress > 0 ? -(sidebarWidth - progress) : -sidebarWidth;
        openTranslateXRef.current = currentTranslateX;
        setSidebarTranslateX(currentTranslateX);
      }
    }

    function handleTouchEnd() {
      if (openPhaseRef.current !== "swiping") {
        openPhaseRef.current = "idle";
        return;
      }

      const sidebarWidth = getSidebarWidth();
      const threshold = sidebarWidth * SIDEBAR_SWIPE_THRESHOLD_PERCENT;

      if (side === "right") {
        const movedDistance = sidebarWidth - openTranslateXRef.current;
        if (movedDistance >= threshold) {
          onOpenRef.current();
        }
      } else {
        const movedDistance = sidebarWidth + openTranslateXRef.current;
        if (movedDistance >= threshold) {
          onOpenRef.current();
        }
      }

      openPhaseRef.current = "idle";
      openTranslateXRef.current = 0;
      setSidebarTranslateX(0);
    }

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDesktop, side, sidebarRef]);

  // Swipe-to-close (listens on sidebar ref)
  useEffect(() => {
    if (isDesktop) return;

    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    function getSidebarWidth(): number {
      return sidebarElement?.offsetWidth ?? 0;
    }

    function handleTouchStart(event: TouchEvent) {
      if (!isOpenRef.current) return;

      const touch = event.touches[0];
      closePhaseRef.current = "detecting";
      closeStartXRef.current = touch.clientX;
      closeStartYRef.current = touch.clientY;
      closeTranslateXRef.current = 0;
    }

    function handleTouchMove(event: TouchEvent) {
      if (closePhaseRef.current === "idle") return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - closeStartXRef.current;
      const deltaY = touch.clientY - closeStartYRef.current;

      if (closePhaseRef.current === "detecting") {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absY > absX && absY > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2) {
          closePhaseRef.current = "idle";
          return;
        }

        // For closing: right sidebar swipes right (+), left sidebar swipes left (-)
        const isClosingDirection = side === "right" ? deltaX > 0 : deltaX < 0;
        if (absX > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2 && isClosingDirection) {
          closePhaseRef.current = "swiping";
        } else if (absX > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2) {
          closePhaseRef.current = "idle";
          return;
        } else {
          return;
        }
      }

      event.preventDefault();

      const sidebarWidth = getSidebarWidth();
      if (sidebarWidth === 0) return;

      if (side === "right") {
        // Closing right sidebar: positive translateX pushes it right
        const clamped = Math.max(0, Math.min(deltaX, sidebarWidth));
        closeTranslateXRef.current = clamped;
        setSidebarTranslateX(clamped);
      } else {
        // Closing left sidebar: negative translateX pushes it left
        const clamped = Math.min(0, Math.max(deltaX, -sidebarWidth));
        closeTranslateXRef.current = clamped;
        setSidebarTranslateX(clamped);
      }
    }

    function handleTouchEnd() {
      if (closePhaseRef.current !== "swiping") {
        closePhaseRef.current = "idle";
        return;
      }

      const sidebarWidth = getSidebarWidth();
      const threshold = sidebarWidth * SIDEBAR_SWIPE_THRESHOLD_PERCENT;

      const movedDistance = Math.abs(closeTranslateXRef.current);
      if (movedDistance >= threshold) {
        onCloseRef.current();
      }

      closePhaseRef.current = "idle";
      closeTranslateXRef.current = 0;
      setSidebarTranslateX(0);
    }

    sidebarElement.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    sidebarElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    sidebarElement.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      sidebarElement.removeEventListener("touchstart", handleTouchStart);
      sidebarElement.removeEventListener("touchmove", handleTouchMove);
      sidebarElement.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDesktop, side, sidebarRef]);

  return { sidebarTranslateX };
}
