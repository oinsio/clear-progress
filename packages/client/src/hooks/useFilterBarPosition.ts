// implements FR6, FR7 of localstorage-refactor
import {
  DEFAULT_FILTER_BAR_POSITION,
  FILTER_BAR_POSITIONS,
  STORAGE_KEYS,
} from "@/constants";
import { usePreference } from "@/hooks/usePreference";
import type { FilterBarPosition } from "@/types/common";

export interface UseFilterBarPositionReturn {
  filterBarPosition: FilterBarPosition;
  setFilterBarPosition: (position: FilterBarPosition) => void;
}

export function useFilterBarPosition(): UseFilterBarPositionReturn {
  const [filterBarPosition, setFilterBarPosition] =
    usePreference<FilterBarPosition>({
      type: "enum",
      key: STORAGE_KEYS.FILTER_BAR_POSITION,
      values: FILTER_BAR_POSITIONS,
      defaultValue: DEFAULT_FILTER_BAR_POSITION,
    });

  return { filterBarPosition, setFilterBarPosition };
}
