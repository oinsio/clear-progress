// implements FR5, FR6, FR7, D7 of configurable-sync-timing
import {
  DEFAULT_AUTO_SYNC_DELAY_SEC,
  DEFAULT_SYNC_INTERVAL_MIN,
  MAX_AUTO_SYNC_DELAY_SEC,
  MAX_SYNC_INTERVAL_MIN,
  MIN_AUTO_SYNC_DELAY_SEC,
  MIN_SYNC_INTERVAL_MIN,
  STORAGE_KEYS,
} from "@/constants";
import { parseIntegerSetting } from "@/services/parseIntegerSetting";

/** Empty string is the disabled sentinel for the periodic sync interval. */
const DISABLED_SYNC_INTERVAL = "";

/**
 * Reads a localStorage cache entry, normalising the "absent" case to
 * `undefined` (matching `SettingsRepository.getValue`) so it can feed the
 * shared {@link parseIntegerSetting}. Returns `undefined` when localStorage is
 * unavailable, so callers fall back to their default without self-healing.
 */
function readCachedSetting(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Synchronous start-up read of the cached periodic sync interval (minutes).
 * Returns `null` when disabled, the validated integer when present and valid,
 * and {@link DEFAULT_SYNC_INTERVAL_MIN} when absent or corrupted (self-healing
 * the corrupted cache entry via {@link parseIntegerSetting}).
 *
 * Implements FR5, FR6, FR7, D7 of configurable-sync-timing.
 */
export function getCachedSyncInterval(): number | null {
  const cachedValue = readCachedSetting(STORAGE_KEYS.SYNC_INTERVAL);
  if (cachedValue === DISABLED_SYNC_INTERVAL) {
    return null;
  }
  return parseIntegerSetting(
    STORAGE_KEYS.SYNC_INTERVAL,
    cachedValue,
    MIN_SYNC_INTERVAL_MIN,
    MAX_SYNC_INTERVAL_MIN,
    DEFAULT_SYNC_INTERVAL_MIN,
  );
}

/**
 * Synchronous start-up read of the cached auto-sync debounce delay (seconds).
 * Returns the validated integer when present and valid (empty string and "0"
 * both parse to 0 = immediate), and {@link DEFAULT_AUTO_SYNC_DELAY_SEC} when
 * absent or corrupted (self-healing the corrupted cache entry).
 *
 * Implements FR6, FR7, D7 of configurable-sync-timing.
 */
export function getCachedAutoSyncDelay(): number {
  return parseIntegerSetting(
    STORAGE_KEYS.AUTO_SYNC_DELAY,
    readCachedSetting(STORAGE_KEYS.AUTO_SYNC_DELAY),
    MIN_AUTO_SYNC_DELAY_SEC,
    MAX_AUTO_SYNC_DELAY_SEC,
    DEFAULT_AUTO_SYNC_DELAY_SEC,
  );
}
