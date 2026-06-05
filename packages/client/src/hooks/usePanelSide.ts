import { useCallback, useState } from "react";
import { DEFAULT_PANEL_SIDE, PANEL_SIDES, STORAGE_KEYS } from "@/constants";
import type { PanelSide } from "@/types/common";

function getCachedPanelSide(): PanelSide {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.PANEL_SIDE);
    if (cached && PANEL_SIDES.includes(cached as PanelSide)) {
      return cached as PanelSide;
    }
  } catch {
    // localStorage is not available
  }
  return DEFAULT_PANEL_SIDE;
}

export interface UsePanelSideReturn {
  panelSide: PanelSide;
  setPanelSide: (side: PanelSide) => void;
}

export function usePanelSide(): UsePanelSideReturn {
  const [panelSide, setPanelSideState] =
    useState<PanelSide>(getCachedPanelSide);

  const setPanelSide = useCallback((side: PanelSide) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PANEL_SIDE, side);
    } catch {
      // localStorage is not available
    }
    setPanelSideState(side);
  }, []);

  return { panelSide, setPanelSide };
}
