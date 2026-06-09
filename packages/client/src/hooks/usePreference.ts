// implements FR6, FR7 of localstorage-refactor

import { useCallback, useState } from "react";
import type { PreferenceConfig } from "@/services/localPreferencesService";
import {
  getPreference,
  setPreference,
} from "@/services/localPreferencesService";

const JSON_TYPE = "json";

/**
 * Generic hook for local preferences stored in localStorage.
 * Implements FR6, FR7 of localstorage-refactor.
 *
 * @returns [currentValue, setter] tuple with stable setter reference.
 */
export function usePreference<T>(
  config: PreferenceConfig<T>,
): [T, (value: T) => void] {
  const [currentValue, setCurrentValue] = useState<T>(() =>
    getPreference(config),
  );

  const updatePreference = useCallback(
    (value: T) => {
      const serialize =
        config.type === JSON_TYPE ? (v: unknown) => JSON.stringify(v) : String;
      setPreference(config.key, value, serialize);
      setCurrentValue(value);
    },
    [config.key, config.type],
  );

  return [currentValue, updatePreference];
}
