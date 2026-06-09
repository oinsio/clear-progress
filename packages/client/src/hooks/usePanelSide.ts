// implements FR6, FR7 of localstorage-refactor
import { DEFAULT_PANEL_SIDE, PANEL_SIDES, STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";
import type { PanelSide } from "@/types/common";

export interface UsePanelSideReturn {
  panelSide: PanelSide;
  setPanelSide: (side: PanelSide) => void;
}

export function usePanelSide(): UsePanelSideReturn {
  const [panelSide, setPanelSide] = usePreference<PanelSide>({
    type: "enum",
    key: STORAGE_KEYS.PANEL_SIDE,
    values: PANEL_SIDES,
    defaultValue: DEFAULT_PANEL_SIDE,
  });

  return { panelSide, setPanelSide };
}
