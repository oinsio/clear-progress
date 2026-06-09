// implements FR6, FR7 of localstorage-refactor
import {
  DEFAULT_HANDEDNESS,
  HANDEDNESS_OPTIONS,
  STORAGE_KEYS,
} from "@/constants";
import { usePreference } from "@/hooks/usePreference";
import type { Handedness } from "@/types/common";

export interface UseHandednessReturn {
  handedness: Handedness;
  setHandedness: (handedness: Handedness) => void;
}

/**
 * Implements FR13 of command-bar.
 */
export function useHandedness(): UseHandednessReturn {
  const [handedness, setHandedness] = usePreference<Handedness>({
    type: "enum",
    key: STORAGE_KEYS.HANDEDNESS,
    values: HANDEDNESS_OPTIONS,
    defaultValue: DEFAULT_HANDEDNESS,
  });

  return { handedness, setHandedness };
}
