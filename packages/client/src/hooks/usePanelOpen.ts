// implements FR6, FR7 of localstorage-refactor
import { useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";

export interface UsePanelOpenReturn {
  isPanelOpen: boolean;
  togglePanelOpen: () => void;
}

export function usePanelOpen(): UsePanelOpenReturn {
  const [isPanelOpen, setIsPanelOpen] = usePreference<boolean>({
    type: "boolean",
    key: STORAGE_KEYS.PANEL_OPEN,
    defaultValue: false,
  });

  const togglePanelOpen = useCallback(() => {
    setIsPanelOpen(!isPanelOpen);
  }, [isPanelOpen, setIsPanelOpen]);

  return { isPanelOpen, togglePanelOpen };
}
