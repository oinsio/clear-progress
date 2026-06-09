// implements FR6, FR7 of localstorage-refactor
import type * as React from "react";
import { useCallback, useRef } from "react";
import {
  PANEL_SPLIT_DEFAULT_RATIO,
  PANEL_SPLIT_MAX_RATIO,
  PANEL_SPLIT_MIN_RATIO,
  STORAGE_KEYS,
} from "@/constants";
import { usePreference } from "@/hooks/usePreference";

function clampRatio(value: number): number {
  return Math.min(
    PANEL_SPLIT_MAX_RATIO,
    Math.max(PANEL_SPLIT_MIN_RATIO, value),
  );
}

export function usePanelSplit() {
  const [ratio, setRatioRaw] = usePreference<number>({
    type: "number",
    key: STORAGE_KEYS.PANEL_SPLIT,
    defaultValue: PANEL_SPLIT_DEFAULT_RATIO,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const setRatio = useCallback(
    (newRatio: number) => {
      setRatioRaw(clampRatio(newRatio));
    },
    [setRatioRaw],
  );

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const containerRect = container.getBoundingClientRect();
        const newRatio =
          (moveEvent.clientX - containerRect.left) / containerRect.width;
        setRatio(newRatio);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [setRatio],
  );

  return { ratio, setRatio, containerRef, handleResizeMouseDown };
}
