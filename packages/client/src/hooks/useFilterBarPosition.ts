// implements FR6, FR7 of localstorage-refactor
// implements FR7 of improve-sidebar-ux
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

  const [filterBarPosition, setFilterBarPosition] =
    usePreference<FilterBarPosition>({
      type: "enum",
      key: STORAGE_KEYS.FILTER_BAR_POSITION,
      values: FILTER_BAR_POSITIONS,
      defaultValue: platformDefault,
    });

  return { filterBarPosition, setFilterBarPosition };
}
