import { useCallback, useState } from "react";
import {
  DEFAULT_FILTER_BAR_POSITION,
  FILTER_BAR_POSITIONS,
  STORAGE_KEYS,
} from "@/constants";
import type { FilterBarPosition } from "@/types/common";

function getCachedFilterBarPosition(): FilterBarPosition {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.FILTER_BAR_POSITION);
    if (cached && FILTER_BAR_POSITIONS.includes(cached as FilterBarPosition)) {
      return cached as FilterBarPosition;
    }
  } catch {
    // localStorage is unavailable
  }
  return DEFAULT_FILTER_BAR_POSITION;
}

export interface UseFilterBarPositionReturn {
  filterBarPosition: FilterBarPosition;
  setFilterBarPosition: (position: FilterBarPosition) => void;
}

export function useFilterBarPosition(): UseFilterBarPositionReturn {
  const [filterBarPosition, setFilterBarPositionState] =
    useState<FilterBarPosition>(getCachedFilterBarPosition);

  const setFilterBarPosition = useCallback((position: FilterBarPosition) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILTER_BAR_POSITION, position);
    } catch {
      // localStorage is unavailable
    }
    setFilterBarPositionState(position);
  }, []);

  return { filterBarPosition, setFilterBarPosition };
}
