import React, { useState, useEffect, useRef } from "react";
import { SWIPE_COMPLETE_THRESHOLD_PERCENT } from "@/constants";

export function useSwipeAction(
  ref: React.RefObject<HTMLDivElement | null>,
  onAction: () => void,
  isEnabled: boolean,
): { translateX: number; isThresholdReached: boolean } {
  const [translateX, setTranslateX] = useState(0);
  const [isThresholdReached, setIsThresholdReached] = useState(false);
  const [threshold, setThreshold] = useState(
    () => window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT,
  );

  const isEnabledRef = useRef(isEnabled);
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const hasStartedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const translateXRef = useRef(0);
  const thresholdRef = useRef(threshold);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  // Update threshold on window resize
  useEffect(() => {
    const handleResize = () => {
      const newThreshold = window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT;
      setThreshold(newThreshold);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isEnabledRef.current) return;
      const noSwipe = (e.target as HTMLElement).closest("[data-no-swipe]");
      if (noSwipe) return;
      const touch = e.touches[0];
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      hasStartedRef.current = true;
      isDraggingRef.current = false;
      isCancelledRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        !isEnabledRef.current ||
        !hasStartedRef.current ||
        isCancelledRef.current
      )
        return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      // Cancel on left swipe
      if (deltaX < 0) {
        isCancelledRef.current = true;
        return;
      }

      // Detect horizontal swipe (allow some vertical drift)
      if (!isDraggingRef.current) {
        const absY = Math.abs(deltaY);
        const absX = Math.abs(deltaX);

        // If vertical movement is dominant, cancel
        if (absY > absX && absY > 10) {
          isCancelledRef.current = true;
          translateXRef.current = 0;
          setTranslateX(0);
          setIsThresholdReached(false);
          return;
        }

        // Start dragging if horizontal movement is significant
        if (deltaX > 5) {
          isDraggingRef.current = true;
        }
      }

      if (isDraggingRef.current) {
        e.preventDefault();
        const maxTranslate = thresholdRef.current * 1.5;
        const clamped = Math.min(deltaX, maxTranslate);
        translateXRef.current = clamped;
        setTranslateX(clamped);
        setIsThresholdReached(clamped >= thresholdRef.current);
      }
    };

    const handleTouchEnd = () => {
      if (
        !isEnabledRef.current ||
        !hasStartedRef.current ||
        !isDraggingRef.current
      )
        return;
      if (translateXRef.current >= thresholdRef.current) {
        onActionRef.current();
      }
      translateXRef.current = 0;
      setTranslateX(0);
      setIsThresholdReached(false);
      hasStartedRef.current = false;
      isDraggingRef.current = false;
      isCancelledRef.current = false;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref]);

  return { translateX, isThresholdReached };
}
