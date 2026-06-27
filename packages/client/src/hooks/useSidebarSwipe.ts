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
  isSwiping: boolean;
}

type SwipePhase = "idle" | "detecting" | "swiping";

interface SwipeGestureConfig {
  shouldStartDetecting: (touch: Touch) => boolean;
  isSwipeDirection: (deltaX: number) => boolean;
  computeTranslateX: (deltaX: number, sidebarWidth: number) => number;
  computeMovedDistance: (translateX: number, sidebarWidth: number) => number;
  onCommit: () => void;
}

function createSwipeHandlers(
  config: SwipeGestureConfig,
  phaseRef: React.MutableRefObject<SwipePhase>,
  startXRef: React.MutableRefObject<number>,
  startYRef: React.MutableRefObject<number>,
  translateXRef: React.MutableRefObject<number>,
  getSidebarWidth: () => number,
  setIsSwiping: (value: boolean) => void,
  setSidebarTranslateX: (value: number) => void,
) {
  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (!config.shouldStartDetecting(touch)) return;

    phaseRef.current = "detecting";
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    translateXRef.current = 0;
  }

  function handleTouchMove(event: TouchEvent) {
    if (phaseRef.current === "idle") return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    if (phaseRef.current === "detecting") {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absY > absX && absY > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2) {
        phaseRef.current = "idle";
        return;
      }

      if (
        absX > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2 &&
        config.isSwipeDirection(deltaX)
      ) {
        phaseRef.current = "swiping";
        setIsSwiping(true);
      } else if (absX > SIDEBAR_SWIPE_EDGE_ZONE_PX / 2) {
        phaseRef.current = "idle";
        return;
      } else {
        return;
      }
    }

    event.preventDefault();

    const sidebarWidth = getSidebarWidth();
    if (sidebarWidth === 0) return;

    const currentTranslateX = config.computeTranslateX(deltaX, sidebarWidth);
    translateXRef.current = currentTranslateX;
    setSidebarTranslateX(currentTranslateX);
  }

  function handleTouchEnd() {
    if (phaseRef.current !== "swiping") {
      phaseRef.current = "idle";
      return;
    }

    const sidebarWidth = getSidebarWidth();
    const threshold = sidebarWidth * SIDEBAR_SWIPE_THRESHOLD_PERCENT;
    const movedDistance = config.computeMovedDistance(
      translateXRef.current,
      sidebarWidth,
    );

    if (movedDistance >= threshold) {
      config.onCommit();
    }

    phaseRef.current = "idle";
    translateXRef.current = 0;
    setIsSwiping(false);
    setSidebarTranslateX(0);
  }

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}

export function useSidebarSwipe({
  sidebarRef,
  side,
  isOpen,
  isDesktop,
  onOpen,
  onClose,
}: UseSidebarSwipeOptions): UseSidebarSwipeReturn {
  const [sidebarTranslateX, setSidebarTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

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

  function useSwipeGesture(
    config: SwipeGestureConfig,
    phaseRef: React.MutableRefObject<SwipePhase>,
    startXRef: React.MutableRefObject<number>,
    startYRef: React.MutableRefObject<number>,
    translateXRef: React.MutableRefObject<number>,
  ) {
    useEffect(() => {
      if (isDesktop) return;

      function getSidebarWidth(): number {
        return sidebarRef.current?.offsetWidth ?? 0;
      }

      const { handleTouchStart, handleTouchMove, handleTouchEnd } =
        createSwipeHandlers(
          config,
          phaseRef,
          startXRef,
          startYRef,
          translateXRef,
          getSidebarWidth,
          setIsSwiping,
          setSidebarTranslateX,
        );

      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });

      return () => {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDesktop, side, sidebarRef]);
  }

  function isEdgeTouch(touchX: number): boolean {
    if (side === "right") {
      return window.innerWidth - touchX < SIDEBAR_SWIPE_EDGE_ZONE_PX;
    }
    return touchX < SIDEBAR_SWIPE_EDGE_ZONE_PX;
  }

  // Edge swipe to open
  useSwipeGesture(
    {
      shouldStartDetecting: (touch) =>
        !isOpenRef.current && isEdgeTouch(touch.clientX),
      isSwipeDirection: () => true,
      computeTranslateX: (deltaX, sidebarWidth) => {
        if (side === "right") {
          const progress = Math.min(Math.abs(deltaX), sidebarWidth);
          return sidebarWidth - progress;
        }
        const progress = Math.min(deltaX, sidebarWidth);
        return progress > 0 ? -(sidebarWidth - progress) : -sidebarWidth;
      },
      computeMovedDistance: (translateX, sidebarWidth) =>
        side === "right"
          ? sidebarWidth - translateX
          : sidebarWidth + translateX,
      onCommit: () => onOpenRef.current(),
    },
    openPhaseRef,
    openStartXRef,
    openStartYRef,
    openTranslateXRef,
  );

  // Swipe-to-close
  useSwipeGesture(
    {
      shouldStartDetecting: (touch) =>
        isOpenRef.current &&
        !!sidebarRef.current?.contains(touch.target as Node),
      isSwipeDirection: (deltaX) =>
        side === "right" ? deltaX > 0 : deltaX < 0,
      computeTranslateX: (deltaX, sidebarWidth) => {
        if (side === "right") {
          return Math.max(0, Math.min(deltaX, sidebarWidth));
        }
        return Math.min(0, Math.max(deltaX, -sidebarWidth));
      },
      computeMovedDistance: (translateX) => Math.abs(translateX),
      onCommit: () => onCloseRef.current(),
    },
    closePhaseRef,
    closeStartXRef,
    closeStartYRef,
    closeTranslateXRef,
  );

  return { sidebarTranslateX, isSwiping };
}
