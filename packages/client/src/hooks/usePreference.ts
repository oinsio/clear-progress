// implements FR6, FR7 of localstorage-refactor

import { useCallback, useEffect, useState } from "react";
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

  // Sync state when localStorage changes from another component
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | CustomEvent) => {
      const key =
        event instanceof StorageEvent
          ? event.key
          : (event as CustomEvent<{ key: string }>).detail?.key;
      if (key === config.key) {
        setCurrentValue(getPreference(config));
      }
    };

    window.addEventListener("storage", handleStorageChange as EventListener);
    window.addEventListener(
      "local-storage-change",
      handleStorageChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange as EventListener,
      );
      window.removeEventListener(
        "local-storage-change",
        handleStorageChange as EventListener,
      );
    };
  }, [config]);

  const updatePreference = useCallback(
    (value: T) => {
      const serialize =
        config.type === JSON_TYPE ? (v: unknown) => JSON.stringify(v) : String;
      setPreference(config.key, value, serialize);
      setCurrentValue(value);
      // Dispatch custom event for same-window sync
      window.dispatchEvent(
        new CustomEvent("local-storage-change", {
          detail: { key: config.key },
        }),
      );
    },
    [config.key, config.type],
  );

  return [currentValue, updatePreference];
}
