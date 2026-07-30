// implements FR3, FR4, D7 of configurable-sync-timing
import { STORAGE_KEYS } from "@/constants";
import { mockSettingsGetValue } from "@/test/helpers/mockRepositories";

export { mockSettingsGetValue };

/**
 * Makes the shared, mocked SettingsRepository resolve `value` for
 * STORAGE_KEYS.SYNC_INTERVAL specifically, and `undefined` (→ default) for
 * every other key — mirrors the component-level helper in
 * SyncProvider.periodic-interval.test.tsx.
 */
export function mockSyncIntervalSetting(value: string | undefined): void {
  mockSettingsGetValue.mockImplementation(async (key: string) =>
    key === STORAGE_KEYS.SYNC_INTERVAL ? value : undefined,
  );
}

/**
 * Makes the shared, mocked SettingsRepository resolve `value` for
 * STORAGE_KEYS.AUTO_SYNC_DELAY specifically, and `undefined` (→ default) for
 * every other key — mirrors the component-level helper in
 * SyncProvider.schedule.test.tsx.
 */
export function mockAutoSyncDelaySetting(value: string | undefined): void {
  mockSettingsGetValue.mockImplementation(async (key: string) =>
    key === STORAGE_KEYS.AUTO_SYNC_DELAY ? value : undefined,
  );
}

/**
 * Dispatches the "sync_complete" event SyncService.pull() fires after every
 * pull — simulates a value delivered via PULL for D7 propagation scenarios.
 */
export function dispatchSyncComplete(): void {
  window.dispatchEvent(new CustomEvent("sync_complete"));
}
