// implements FR6, FR7 of localstorage-refactor
// implements FR7 of improve-sidebar-ux
// implements FR1, FR2 of fix-command-bar-position-drift
import {
  DESKTOP_FILTER_BAR_POSITION,
  FILTER_BAR_POSITIONS,
  MOBILE_FILTER_BAR_POSITION,
  STORAGE_KEYS,
} from "@/constants";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePreference } from "@/hooks/usePreference";
import type { FilterBarPosition } from "@/types/common";

export interface UseFilterBarPositionReturn {
  filterBarPosition: FilterBarPosition;
  setFilterBarPosition: (position: FilterBarPosition) => void;
}

export function useFilterBarPosition(): UseFilterBarPositionReturn {
  const isDesktop = useIsDesktop();
  const platformDefault = isDesktop
    ? DESKTOP_FILTER_BAR_POSITION
    : MOBILE_FILTER_BAR_POSITION;

  // Lock in the platform default on first visit so resizing the window
  // does not flip the command bar to the other position's default.
  if (localStorage.getItem(STORAGE_KEYS.FILTER_BAR_POSITION) === null) {
    localStorage.setItem(STORAGE_KEYS.FILTER_BAR_POSITION, platformDefault);
  }

  const [filterBarPosition, setFilterBarPosition] =
    usePreference<FilterBarPosition>({
      type: "enum",
      key: STORAGE_KEYS.FILTER_BAR_POSITION,
      values: FILTER_BAR_POSITIONS,
      defaultValue: platformDefault,
    });

  return { filterBarPosition, setFilterBarPosition };
}
