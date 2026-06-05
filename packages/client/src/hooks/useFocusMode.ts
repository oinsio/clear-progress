import { useCallback, useState } from "react";
import { DEFAULT_FOCUS_OPACITY, STORAGE_KEYS } from "@/constants";

const DEFAULT_FOCUS_MODE = true;

function getCachedFocusMode(): boolean {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.FOCUS_MODE);
    if (cached !== null) {
      return cached === "true";
    }
  } catch {
    // localStorage is unavailable
  }
  return DEFAULT_FOCUS_MODE;
}

function getCachedFocusOpacity(): number {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.FOCUS_OPACITY);
    if (cached !== null) {
      const parsed = Number(cached);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  } catch {
    // localStorage is unavailable
  }
  return DEFAULT_FOCUS_OPACITY;
}

export interface UseFocusModeReturn {
  isFocusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  focusOpacity: number;
  setFocusOpacity: (value: number) => void;
}

export function useFocusMode(): UseFocusModeReturn {
  const [isFocusMode, setFocusModeState] =
    useState<boolean>(getCachedFocusMode);
  const [focusOpacity, setFocusOpacityState] = useState<number>(
    getCachedFocusOpacity,
  );

  const setFocusMode = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_MODE, String(enabled));
    } catch {
      // localStorage is unavailable
    }
    setFocusModeState(enabled);
  }, []);

  const setFocusOpacity = useCallback((value: number) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_OPACITY, String(value));
    } catch {
      // localStorage is unavailable
    }
    setFocusOpacityState(value);
  }, []);

  return { isFocusMode, setFocusMode, focusOpacity, setFocusOpacity };
}
