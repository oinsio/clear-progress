// implements FR1, FR2, FR8 of pin-task-detail-panel
import { STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";

export interface UseDetailPanelPinnedReturn {
  isDetailPanelPinned: boolean;
  setDetailPanelPinned: (value: boolean) => void;
}

/**
 * Implements FR1, FR2, FR8 of pin-task-detail-panel.
 */
export function useDetailPanelPinned(): UseDetailPanelPinnedReturn {
  const [isDetailPanelPinned, setDetailPanelPinned] = usePreference<boolean>({
    type: "boolean",
    key: STORAGE_KEYS.DETAIL_PANEL_PINNED,
    defaultValue: false,
  });

  return { isDetailPanelPinned, setDetailPanelPinned };
}
