import React, { useRef, useCallback } from "react";
import {
  LONG_PRESS_THRESHOLD_MS,
  LONG_PRESS_MOVE_THRESHOLD_PX,
} from "@/constants";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number;
  moveThreshold?: number;
}

interface LongPressHandlers {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchCancel: (event: React.TouchEvent) => void;
  onClick: (event: React.MouseEvent) => void;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = LONG_PRESS_THRESHOLD_MS,
  moveThreshold = LONG_PRESS_MOVE_THRESHOLD_PX,
}: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      event.preventDefault();

      startPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
      longPressTriggeredRef.current = false;

      clearTimer();

      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold, clearTimer],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || !startPositionRef.current) return;

      const deltaX = Math.abs(touch.clientX - startPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPositionRef.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > moveThreshold) {
        clearTimer();
        startPositionRef.current = null;
      }
    },
    [moveThreshold, clearTimer],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      clearTimer();

      if (!longPressTriggeredRef.current && onClick && startPositionRef.current) {
        event.preventDefault();
        onClick();
      }

      startPositionRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [onClick, clearTimer],
  );

  const handleTouchCancel = useCallback(
    () => {
      clearTimer();
      startPositionRef.current = null;
      longPressTriggeredRef.current = false;
    },
    [clearTimer],
  );

  const handleClick = useCallback(
    () => {
      if (onClick) {
        onClick();
      }
    },
    [onClick],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onTouchCancel: handleTouchCancel,
    onClick: handleClick,
  };
}
