import React, { useState, useEffect, useRef } from "react";
import {
  SWIPE_COMPLETE_THRESHOLD_RATIO,
  SWIPE_VELOCITY_THRESHOLD,
  SWIPE_MIN_DISTANCE_FOR_VELOCITY,
  SWIPE_MAX_VERTICAL_DRIFT_PX,
  SWIPE_DAMPING_FACTOR,
} from "@/constants";

type SwipePhase = "idle" | "swiping" | "completing";

export interface SwipeToCompleteState {
  progress: number;
  isThresholdReached: boolean;
  phase: SwipePhase;
}

export function useSwipeToComplete(
  ref: React.RefObject<HTMLDivElement | null>,
  onComplete: () => void,
  isEnabled: boolean,
): SwipeToCompleteState {
  const [progress, setProgress] = useState(0);
  const [isThresholdReached, setIsThresholdReached] = useState(false);
  const [phase, setPhase] = useState<SwipePhase>("idle");

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
  const touchStartTimeRef = useRef(0);
  const hasStartedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const translateXRef = useRef(0);
  const thresholdRef = useRef(0);
  const containerWidthRef = useRef(0);
  const phaseRef = useRef<SwipePhase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

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
      touchStartTimeRef.current = Date.now();
      hasStartedRef.current = true;
      isDraggingRef.current = false;
      isCancelledRef.current = false;

      // Measure container width and calculate threshold
      containerWidthRef.current = element.offsetWidth;
      thresholdRef.current =
        containerWidthRef.current * SWIPE_COMPLETE_THRESHOLD_RATIO;

      // Performance: add will-change
      element.style.willChange = "transform";
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

      // Check vertical drift before dragging starts
      if (!isDraggingRef.current) {
        if (Math.abs(deltaY) > SWIPE_MAX_VERTICAL_DRIFT_PX) {
          isCancelledRef.current = true;
          translateXRef.current = 0;
          setProgress(0);
          setIsThresholdReached(false);
          setPhase("idle");
          return;
        }
        if (deltaX > 5) {
          isDraggingRef.current = true;
          setPhase("swiping");
        }
      }

      if (isDraggingRef.current) {
        e.preventDefault();

        const threshold = thresholdRef.current;
        const containerWidth = containerWidthRef.current;

        // Apply damping after threshold
        let displayX: number;
        if (deltaX <= threshold) {
          displayX = deltaX;
        } else {
          const overshoot = deltaX - threshold;
          displayX = threshold + overshoot * SWIPE_DAMPING_FACTOR;
        }

        // Clamp to prevent flying off-screen
        displayX = Math.min(displayX, containerWidth * 0.85);

        translateXRef.current = displayX;

        // Update DOM directly for performance
        element.style.transform = `translateX(${displayX}px)`;

        // Update progress for background/icon reactivity
        const currentProgress = threshold > 0 ? displayX / threshold : 0;
        setProgress(currentProgress);
        setIsThresholdReached(displayX >= threshold);
      }
    };

    const handleTouchEnd = () => {
      if (
        !isEnabledRef.current ||
        !hasStartedRef.current ||
        !isDraggingRef.current
      )
        return;

      const deltaX = translateXRef.current;
      const threshold = thresholdRef.current;
      const elapsedTime = Date.now() - touchStartTimeRef.current;
      const velocity = elapsedTime > 0 ? deltaX / elapsedTime : 0;

      // Check completion conditions
      const isPositionSuccess = deltaX >= threshold;
      const isVelocitySuccess =
        velocity > SWIPE_VELOCITY_THRESHOLD &&
        deltaX > SWIPE_MIN_DISTANCE_FOR_VELOCITY;

      if (isPositionSuccess || isVelocitySuccess) {
        // Call onComplete IMMEDIATELY before animation
        onCompleteRef.current();
        // Then start completing phase for visual feedback
        setPhase("completing");
      } else {
        // Reset to idle
        translateXRef.current = 0;
        element.style.transform = "";
        setProgress(0);
        setIsThresholdReached(false);
        setPhase("idle");
      }

      // Performance: remove will-change
      element.style.willChange = "";

      hasStartedRef.current = false;
      isDraggingRef.current = false;
      isCancelledRef.current = false;
    };

    const handleTransitionEnd = (e: TransitionEvent) => {
      // Only handle transform transitions on the main element
      if (e.target !== element || e.propertyName !== "transform") return;

      if (phaseRef.current === "completing") {
        // Reset state after completion
        translateXRef.current = 0;
        element.style.transform = "";
        element.style.willChange = "";
        setProgress(0);
        setIsThresholdReached(false);
        setPhase("idle");
      }
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, [ref]);

  return { progress, isThresholdReached, phase };
}
