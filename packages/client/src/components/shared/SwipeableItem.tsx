// implements FR13, FR14, NFR-A2, NFR-P3 of swipeable-item
import type React from "react";
import { useRef } from "react";
import {
  SWIPE_BACKGROUND_OPACITY_REST,
  SWIPE_BACKGROUND_OPACITY_SWIPING,
  SWIPE_BACKGROUND_OPACITY_THRESHOLD,
  SWIPE_SNAP_BACK_DURATION_MS,
} from "@/constants";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import type { SwipeActionConfig } from "@/types/swipe";

/** Implements FR13, FR14, NFR-A2, NFR-P3 of swipeable-item */
export interface SwipeableItemProps {
  children: React.ReactNode;
  swipeRight?: SwipeActionConfig;
  swipeLeft?: SwipeActionConfig;
  isSuspended?: boolean;
  isEnabled?: boolean;
}

function computeBackgroundOpacity(
  translateX: number,
  isThresholdReached: boolean,
): number {
  if (translateX === 0) return SWIPE_BACKGROUND_OPACITY_REST;
  if (isThresholdReached) return SWIPE_BACKGROUND_OPACITY_THRESHOLD;
  return SWIPE_BACKGROUND_OPACITY_SWIPING;
}

/** Implements FR13, FR14, NFR-A2, NFR-P3 of swipeable-item */
export function SwipeableItem({
  children,
  swipeRight,
  swipeLeft,
  isSuspended,
  isEnabled,
}: SwipeableItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { translateX, isThresholdReached, isSwiping } = useSwipeGesture({
    ref: containerRef,
    swipeRight,
    swipeLeft,
    isSuspended,
    isEnabled,
  });

  const opacity = computeBackgroundOpacity(translateX, isThresholdReached);

  const contentTransition = isSwiping
    ? "none"
    : `transform ${SWIPE_SNAP_BACK_DURATION_MS}ms ease-out`;

  return (
    <div
      className="relative overflow-hidden"
      style={{ touchAction: "pan-y" }}
      ref={containerRef}
      data-testid="swipeable-container"
    >
      {swipeRight && (
        <div
          className={`absolute inset-0 flex items-center pl-4 ${swipeRight.color}`}
          aria-hidden="true"
          style={{ opacity }}
          data-testid="swipe-background-left"
        >
          <swipeRight.icon className="text-white" />
        </div>
      )}

      {swipeLeft && (
        <div
          className={`absolute inset-0 flex items-center justify-end pr-4 ${swipeLeft.color}`}
          aria-hidden="true"
          style={{ opacity }}
          data-testid="swipe-background-right"
        >
          <swipeLeft.icon className="text-white" />
        </div>
      )}

      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: contentTransition,
          willChange: "transform",
        }}
        data-testid="swipeable-content"
      >
        {children}
      </div>
    </div>
  );
}
