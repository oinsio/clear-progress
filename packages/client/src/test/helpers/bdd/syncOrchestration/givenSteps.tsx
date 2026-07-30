// implements sync-orchestration of sync-update
import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  mockAutoSyncDelaySetting,
  mockSyncIntervalSetting,
} from "./settingsMocks";
import { flushSyncCycle, renderSyncProvider } from "./testSetup";
import type { SyncTestContext } from "./types";

export function createGivenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    givenSyncProviderMountedAndInitialSyncCompleted: (
      Given: StepTest["Given"],
    ) => {
      Given("SyncProvider has mounted and initial sync completed", async () => {
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        f.context.initialSyncCallCount = f.context.mockPush.mock.calls.length;
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockPing.mockClear();
        f.context.mockFileSync.mockClear();
      });
    },
    givenNavigatorIsOffline: (Given: StepTest["Given"]) => {
      Given("navigator is offline", () => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          configurable: true,
          value: false,
        });
      });
    },
    givenPingIntervalIsActive: (Given: StepTest["Given"]) => {
      Given("ping interval is active", async () => {
        // Set navigator offline to trigger ping interval
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          configurable: true,
          value: false,
        });
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        // Clear mocks after setup
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockPing.mockClear();
        f.context.mockInit.mockClear();
      });
    },
    givenSyncHasFailedWithOneAuthError: (Given: StepTest["Given"]) => {
      Given(
        "sync has failed with 1 auth error and silentRefresh was called",
        async () => {
          const authError = new Error("Unauthorized");
          authError.name = "ApiAuthError";
          f.context.mockPull.mockRejectedValueOnce(authError);
          const { unmount } = renderSyncProvider();
          f.context.syncProviderUnmount = unmount;
          await flushSyncCycle();
          expect(f.context.mockSilentRefresh).toHaveBeenCalledTimes(1);
          // Clear mocks but keep the provider mounted
          f.context.mockSilentRefresh.mockClear();
          f.context.mockSignOut.mockClear();
          f.context.mockPull.mockClear();
          f.context.mockPush.mockClear();
        },
      );
    },
    givenSyncProviderHasMounted: (Given: StepTest["Given"]) => {
      Given("SyncProvider has mounted", async () => {
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockFileSync.mockClear();
      });
    },
    // implements FR3 of configurable-sync-timing
    givenSyncIntervalIsConfiguredToMinutes: (
      Given: StepTest["Given"],
      minutes: number,
    ) => {
      Given(`sync_interval is configured to ${minutes} minutes`, () => {
        mockSyncIntervalSetting(String(minutes));
      });
    },
    // implements FR3 of configurable-sync-timing
    givenSyncIntervalIsConfiguredToEmpty: (Given: StepTest["Given"]) => {
      Given("sync_interval is configured to empty (disabled)", () => {
        mockSyncIntervalSetting("");
      });
    },
    // implements FR4 of configurable-sync-timing
    givenAutoSyncDelayIsConfiguredToSeconds: (
      Given: StepTest["Given"],
      seconds: number,
    ) => {
      Given(`auto_sync_delay is configured to ${seconds} seconds`, () => {
        mockAutoSyncDelaySetting(String(seconds));
      });
    },
  };
}
