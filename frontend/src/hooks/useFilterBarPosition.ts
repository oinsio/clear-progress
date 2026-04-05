import { useState, useCallback } from "react";
import type { FilterBarPosition } from "@/types/common";
import {
  DEFAULT_FILTER_BAR_POSITION,
  FILTER_BAR_POSITIONS,
  STORAGE_KEYS,
} from "@/constants";

function getCachedFilterBarPosition(): FilterBarPosition {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.FILTER_BAR_POSITION);
    if (cached && FILTER_BAR_POSITIONS.includes(cached as FilterBarPosition)) {
      return cached as FilterBarPosition;
    }
  } catch {
    // localStorage недоступен
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
      // localStorage недоступен
    }
    setFilterBarPositionState(position);
  }, []);

  return { filterBarPosition, setFilterBarPosition };
}
