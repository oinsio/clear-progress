import { renderHook } from "@testing-library/react";
import type React from "react";
import { useLongPress } from "./useLongPress";

export const createTouchEvent = (
  type: string,
  x: number,
  y: number,
): React.TouchEvent => {
  const touchList = [{ clientX: x, clientY: y } as Touch];
  const event = new TouchEvent(type, {
    touches: type === "touchend" ? undefined : touchList,
    changedTouches: type === "touchend" ? touchList : undefined,
  });
  return event as unknown as React.TouchEvent;
};

export const setupHook = (
  onLongPress: () => void,
  onClick?: () => void,
  threshold?: number,
  moveThreshold?: number,
) => {
  return renderHook(() =>
    useLongPress({
      onLongPress,
      onClick,
      threshold,
      moveThreshold,
    }),
  );
};
