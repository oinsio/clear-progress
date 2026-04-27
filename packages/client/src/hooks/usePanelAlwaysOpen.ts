import { useContext } from "react";
import { PanelSettingsContext } from "@/app/providers/PanelSettingsProvider";

export interface UsePanelAlwaysOpenReturn {
  isPanelAlwaysOpen: boolean;
  setPanelAlwaysOpen: (value: boolean) => void;
}

const FALLBACK: UsePanelAlwaysOpenReturn = {
  isPanelAlwaysOpen: false,
  setPanelAlwaysOpen: () => {},
};

export function usePanelAlwaysOpen(): UsePanelAlwaysOpenReturn {
  const context = useContext(PanelSettingsContext);
  return context ?? FALLBACK;
}
