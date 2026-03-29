import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";

function getCachedPanelAlwaysOpen(): boolean {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.PANEL_ALWAYS_OPEN);
    return cached === "true";
  } catch {
    // localStorage недоступен
  }
  return false;
}

export interface UsePanelAlwaysOpenReturn {
  isPanelAlwaysOpen: boolean;
  setPanelAlwaysOpen: (value: boolean) => void;
}

export function usePanelAlwaysOpen(): UsePanelAlwaysOpenReturn {
  const [isPanelAlwaysOpen, setIsPanelAlwaysOpenState] = useState<boolean>(getCachedPanelAlwaysOpen);

  const setPanelAlwaysOpen = useCallback((value: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PANEL_ALWAYS_OPEN, String(value));
    } catch {
      // localStorage недоступен
    }
    setIsPanelAlwaysOpenState(value);
  }, []);

  return { isPanelAlwaysOpen, setPanelAlwaysOpen };
}
