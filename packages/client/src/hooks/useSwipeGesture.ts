// implements FR1-FR12 of swipeable-item
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SWIPE_COMPLETE_THRESHOLD_PERCENT,
  SWIPE_DRAG_START_PX,
  SWIPE_RUBBER_BAND_FACTOR,
  SWIPE_VELOCITY_THRESHOLD_PX_PER_MS,
  SWIPE_VERTICAL_CANCEL_PX,
} from "@/constants";
import type { SwipeActionConfig, SwipeDirection } from "@/types/swipe";

export interface UseSwipeGestureOptions {
  ref: React.RefObject<HTMLElement | null>;
  swipeRight?: SwipeActionConfig;
  swipeLeft?: SwipeActionConfig;
  isSuspended?: boolean;
  isEnabled?: boolean;
}

export interface UseSwipeGestureResult {
  translateX: number;
  isThresholdReached: boolean;
  direction: SwipeDirection | null;
  isSwiping: boolean;
  activeAction: SwipeActionConfig | null;
}

export function useSwipeGesture(
  options: UseSwipeGestureOptions,
): UseSwipeGestureResult {
  const { ref, swipeRight, swipeLeft, isSuspended = false } = options;

  const [translateX, setTranslateX] = useState(0);
  const [isThresholdReached, setIsThresholdReached] = useState(false);
  const [direction, setDirection] = useState<SwipeDirection | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [activeAction, setActiveAction] = useState<SwipeActionConfig | null>(
    null,
  );

  const [threshold, setThreshold] = useState(
    () => window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT,
  );

  // Refs for intermediate values (NFR-P2: avoid re-renders)
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const hasStartedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const translateXRef = useRef(0);
  const thresholdRef = useRef(threshold);
  const lastMoveXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const prevMoveXRef = useRef(0);
  const prevMoveTimeRef = useRef(0);
  const moveCountRef = useRef(0);

  // Keep refs in sync with props
  const swipeRightRef = useRef(swipeRight);
  useEffect(() => {
    swipeRightRef.current = swipeRight;
  }, [swipeRight]);

  const swipeLeftRef = useRef(swipeLeft);
  useEffect(() => {
    swipeLeftRef.current = swipeLeft;
  }, [swipeLeft]);

  const isSuspendedRef = useRef(isSuspended);
  useEffect(() => {
    isSuspendedRef.current = isSuspended;
  }, [isSuspended]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const resetState = useCallback(() => {
    hasStartedRef.current = false;
    isDraggingRef.current = false;
    isCancelledRef.current = false;
    translateXRef.current = 0;
    moveCountRef.current = 0;
    setTranslateX(0);
    setIsThresholdReached(false);
    setDirection(null);
    setIsSwiping(false);
    setActiveAction(null);
  }, []);

  // FR5: cancel active swipe on suspension
  useEffect(() => {
    if (isSuspended && hasStartedRef.current) {
      resetState();
    }
  }, [isSuspended, resetState]);

  // FR10: recalculate threshold on resize
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

    const handlePointerDown = (event: PointerEvent) => {
      if (isSuspendedRef.current) return;

      // FR9: check data-no-swipe
      const target = event.target as HTMLElement;
      if (target.closest("[data-no-swipe]")) return;

      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      hasStartedRef.current = true;
      isDraggingRef.current = false;
      isCancelledRef.current = false;
      lastMoveXRef.current = event.clientX;
      lastMoveTimeRef.current = performance.now();
      prevMoveXRef.current = event.clientX;
      prevMoveTimeRef.current = performance.now();
      moveCountRef.current = 0;

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (
        isSuspendedRef.current ||
        !hasStartedRef.current ||
        isCancelledRef.current
      ) {
        return;
      }

      const deltaX = event.clientX - startXRef.current;
      const deltaY = event.clientY - startYRef.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // FR8: vertical movement cancellation
      if (!isDraggingRef.current) {
        if (absY > absX && absY > SWIPE_VERTICAL_CANCEL_PX) {
          isCancelledRef.current = true;
          translateXRef.current = 0;
          setTranslateX(0);
          setIsThresholdReached(false);
          setDirection(null);
          setIsSwiping(false);
          setActiveAction(null);
          return;
        }

        // FR6: detect drag start
        if (absX > SWIPE_DRAG_START_PX) {
          const swipeDirection: SwipeDirection = deltaX > 0 ? "right" : "left";
          const configForDirection =
            swipeDirection === "right"
              ? swipeRightRef.current
              : swipeLeftRef.current;

          // FR2: ignore if no config for direction
          if (!configForDirection) {
            isCancelledRef.current = true;
            return;
          }

          isDraggingRef.current = true;
          setIsSwiping(true);
          setDirection(swipeDirection);
          setActiveAction(configForDirection);
        }
      }

      if (isDraggingRef.current) {
        // Update velocity tracking
        prevMoveXRef.current = lastMoveXRef.current;
        prevMoveTimeRef.current = lastMoveTimeRef.current;
        lastMoveXRef.current = event.clientX;
        lastMoveTimeRef.current = performance.now();
        moveCountRef.current += 1;

        // FR7: clamp with rubber band factor
        const maxTranslate = thresholdRef.current * SWIPE_RUBBER_BAND_FACTOR;
        const clamped =
          deltaX > 0
            ? Math.min(deltaX, maxTranslate)
            : Math.max(deltaX, -maxTranslate);

        translateXRef.current = clamped;
        setTranslateX(clamped);
        setIsThresholdReached(Math.abs(clamped) >= thresholdRef.current);
      }
    };

    const handlePointerUp = () => {
      if (!hasStartedRef.current) {
        cleanupDocumentListeners();
        return;
      }

      if (isDraggingRef.current) {
        const absDist = Math.abs(translateXRef.current);
        const isDistanceReached = absDist >= thresholdRef.current;

        // FR4: velocity check (requires at least 2 pointermove events)
        const MIN_MOVE_COUNT_FOR_VELOCITY = 2;
        let isVelocityReached = false;
        if (moveCountRef.current >= MIN_MOVE_COUNT_FOR_VELOCITY) {
          const timeDelta = lastMoveTimeRef.current - prevMoveTimeRef.current;
          const distanceDelta = Math.abs(
            lastMoveXRef.current - prevMoveXRef.current,
          );
          const velocity = timeDelta > 0 ? distanceDelta / timeDelta : 0;
          isVelocityReached = velocity >= SWIPE_VELOCITY_THRESHOLD_PX_PER_MS;
        }

        if (isDistanceReached || isVelocityReached) {
          const currentDirection = translateXRef.current > 0 ? "right" : "left";
          const actionConfig =
            currentDirection === "right"
              ? swipeRightRef.current
              : swipeLeftRef.current;
          actionConfig?.onAction();
        }
      }

      // FR11: reset all state on pointerup
      resetState();
      cleanupDocumentListeners();
    };

    const cleanupDocumentListeners = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    element.addEventListener("pointerdown", handlePointerDown);

    // FR12: cleanup on unmount
    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      cleanupDocumentListeners();
    };
  }, [ref, resetState]);

  return { translateX, isThresholdReached, direction, isSwiping, activeAction };
}
