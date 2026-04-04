import React, { useState, useEffect, useRef } from "react";
import { SWIPE_COMPLETE_THRESHOLD_PX, SWIPE_MAX_VERTICAL_DRIFT_PX } from "@/constants";

export function useSwipeToComplete(
  ref: React.RefObject<HTMLDivElement | null>,
  onComplete: () => void,
  isEnabled: boolean,
): { translateX: number; isThresholdReached: boolean } {
  const [translateX, setTranslateX] = useState(0);
  const [isThresholdReached, setIsThresholdReached] = useState(false);

  const isEnabledRef = useRef(isEnabled);
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const hasStartedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const translateXRef = useRef(0);

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
      if (!isEnabledRef.current || !hasStartedRef.current || isCancelledRef.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      if (deltaX < 0) {
        isCancelledRef.current = true;
        return;
      }

      if (!isDraggingRef.current) {
        if (Math.abs(deltaY) > SWIPE_MAX_VERTICAL_DRIFT_PX) {
          isCancelledRef.current = true;
          translateXRef.current = 0;
          setTranslateX(0);
          setIsThresholdReached(false);
          return;
        }
        if (deltaX > 5) {
          isDraggingRef.current = true;
        }
      }

      if (isDraggingRef.current) {
        e.preventDefault();
        const clamped = Math.min(deltaX, SWIPE_COMPLETE_THRESHOLD_PX * 1.5);
        translateXRef.current = clamped;
        setTranslateX(clamped);
        setIsThresholdReached(clamped >= SWIPE_COMPLETE_THRESHOLD_PX);
      }
    };

    const handleTouchEnd = () => {
      if (!isEnabledRef.current || !hasStartedRef.current || !isDraggingRef.current) return;
      if (translateXRef.current >= SWIPE_COMPLETE_THRESHOLD_PX) {
        onCompleteRef.current();
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
