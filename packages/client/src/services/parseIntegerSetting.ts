import { removePreference } from "@/services/localPreferencesService";

/**
 * Parses a raw setting value into an integer within [minValue, maxValue].
 * Returns defaultValue when the value is not an integer or falls outside the range.
 * Does not clamp — out-of-range values fall back to defaultValue.
 *
 * Implements FR7 of configurable-sync-timing: when a present value fails
 * validation the stale localStorage cache entry is removed (self-heal), so a
 * corrupted start-up cache cannot feed NaN/out-of-range timing to the sync
 * engine. Self-healing is read-only with respect to the settings store — the
 * IndexedDB value is never rewritten. An absent value (undefined) is not a
 * corruption and leaves the cache untouched.
 */
export function parseIntegerSetting(
  key: string,
  rawValue: string | undefined,
  minValue: number,
  maxValue: number,
  defaultValue: number,
): number {
  const parsedValue = Number(rawValue);
  const isValidInteger =
    Number.isInteger(parsedValue) &&
    parsedValue >= minValue &&
    parsedValue <= maxValue;

  if (isValidInteger) {
    return parsedValue;
  }

  if (rawValue !== undefined) {
    removePreference(key);
  }
  return defaultValue;
}
