import { useCallback, useState } from "react";
import {
  DEFAULT_HANDEDNESS,
  HANDEDNESS_OPTIONS,
  STORAGE_KEYS,
} from "@/constants";
import type { Handedness } from "@/types/common";

function getCachedHandedness(): Handedness {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.HANDEDNESS);
    if (cached && HANDEDNESS_OPTIONS.includes(cached as Handedness)) {
      return cached as Handedness;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_HANDEDNESS;
}

export interface UseHandednessReturn {
  handedness: Handedness;
  setHandedness: (handedness: Handedness) => void;
}

/**
 * Implements FR13 of command-bar.
 */
export function useHandedness(): UseHandednessReturn {
  const [handedness, setHandednessState] =
    useState<Handedness>(getCachedHandedness);

  const setHandedness = useCallback((value: Handedness) => {
    try {
      localStorage.setItem(STORAGE_KEYS.HANDEDNESS, value);
    } catch {
      // localStorage unavailable
    }
    setHandednessState(value);
  }, []);

  return { handedness, setHandedness };
}
