// implements FR6, FR7 of localstorage-refactor
// implements FR7 of improve-sidebar-ux
import {
  DESKTOP_PANEL_SIDE,
  MOBILE_PANEL_SIDE,
  PANEL_SIDES,
  STORAGE_KEYS,
} from "@/constants";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePreference } from "@/hooks/usePreference";
import type { PanelSide } from "@/types/common";

export interface UsePanelSideReturn {
  panelSide: PanelSide;
  setPanelSide: (side: PanelSide) => void;
}

export function usePanelSide(): UsePanelSideReturn {
  const isDesktop = useIsDesktop();
  const platformDefault = isDesktop ? DESKTOP_PANEL_SIDE : MOBILE_PANEL_SIDE;

  const [panelSide, setPanelSide] = usePreference<PanelSide>({
    type: "enum",
    key: STORAGE_KEYS.PANEL_SIDE,
    values: PANEL_SIDES,
    defaultValue: platformDefault,
  });

  return { panelSide, setPanelSide };
}
