// implements FR6, FR7 of localstorage-refactor
import { DEFAULT_FOCUS_OPACITY, STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";

const DEFAULT_FOCUS_MODE = true;

export interface UseFocusModeReturn {
  isFocusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  focusOpacity: number;
  setFocusOpacity: (value: number) => void;
}

export function useFocusMode(): UseFocusModeReturn {
  const [isFocusMode, setFocusMode] = usePreference<boolean>({
    type: "boolean",
    key: STORAGE_KEYS.FOCUS_MODE,
    defaultValue: DEFAULT_FOCUS_MODE,
  });

  const [focusOpacity, setFocusOpacity] = usePreference<number>({
    type: "number",
    key: STORAGE_KEYS.FOCUS_OPACITY,
    defaultValue: DEFAULT_FOCUS_OPACITY,
  });

  return { isFocusMode, setFocusMode, focusOpacity, setFocusOpacity };
}
