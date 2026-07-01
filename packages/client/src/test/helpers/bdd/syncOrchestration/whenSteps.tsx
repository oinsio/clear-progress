// implements sync-orchestration of sync-update
import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { screen } from "@testing-library/react/pure";
import { vi } from "vitest";
import { flushSyncCycle, renderSyncProvider } from "./testSetup";
import type { SyncTestContext } from "./types";

export function createWhenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    whenSyncProviderMounts: (When: StepTest["When"]) => {
      When("SyncProvider mounts", async () => {
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
      });
    },
    whenSyncProviderMountsWithAuthError: (When: StepTest["When"]) => {
      When("SyncProvider mounts", async () => {
        const authError = new Error("Unauthorized");
        authError.name = "ApiAuthError";
        f.context.mockPull.mockRejectedValueOnce(authError);
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
      });
    },
    whenSyncProviderMountsWithRepeatedAuthErrors: (When: StepTest["When"]) => {
      When("SyncProvider mounts", async () => {
        const authError = new Error("Unauthorized");
        authError.name = "ApiAuthError";
        f.context.mockPull.mockRejectedValue(authError);
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        // Initial sync attempt (attempt 1)
        await flushSyncCycle();
        // Trigger periodic syncs for attempts 2 and 3
        for (let i = 1; i < 3; i++) {
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
          await flushSyncCycle();
        }
      });
    },
    whenTimePassesMinutes: (When: StepTest["When"], minutes: number) => {
      When(`${minutes} minutes pass`, async () => {
        await vi.advanceTimersByTimeAsync(minutes * 60 * 1000);
      });
    },
    whenTimePassesSeconds: (When: StepTest["When"], seconds: number) => {
      When(`${seconds} seconds pass`, async () => {
        await vi.advanceTimersByTimeAsync(seconds * 1000);
      });
    },
    whenUserMutatesLocalData: (When: StepTest["When"]) => {
      When("user mutates local data", async () => {
        const scheduleBtn = screen.getByTestId("schedule-btn");
        scheduleBtn.click();
        await vi.advanceTimersByTimeAsync(0);
        f.context.debouncedSyncStartTime = Date.now();
      });
    },
    whenUserMutatesLocalDataAfterSeconds: (
      And: StepTest["When"],
      seconds: number,
    ) => {
      And(
        `user mutates local data again after ${seconds} seconds`,
        async () => {
          await vi.advanceTimersByTimeAsync(seconds * 1000);
          const scheduleBtn = screen.getByTestId("schedule-btn");
          scheduleBtn.click();
          await vi.advanceTimersByTimeAsync(0);
          f.context.debouncedSyncStartTime = Date.now();
        },
      );
    },
    whenBrowserFiresOnlineEvent: (When: StepTest["When"]) => {
      When('the browser fires the "online" event', async () => {
        window.dispatchEvent(new Event("online"));
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenUserClicksSyncIndicator: (When: StepTest["When"]) => {
      When("user clicks the sync indicator", async () => {
        const pullBtn = screen.getByTestId("pull-btn");
        pullBtn.click();
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenSyncFailsWithNetworkError: (And: StepTest["When"]) => {
      And("sync fails with a network error", async () => {
        // Wait for initial sync to complete, then fail
        await flushSyncCycle();
        // Now configure next sync to fail
        f.context.mockPush.mockRejectedValueOnce(new Error("Network error"));
        // Trigger another sync by advancing periodic interval
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      });
    },
    whenPingSucceedsWithInitializedTrue: (When: StepTest["When"]) => {
      When("ping succeeds with initialized=true", async () => {
        f.context.mockPing.mockResolvedValueOnce({
          ok: true,
          app: "Clear Progress",
          version: "1.0",
          initialized: true,
        });
        // Reset push/pull for clean assertion
        f.context.mockPush.mockResolvedValueOnce(undefined);
        f.context.mockPull.mockResolvedValueOnce(undefined);
        await vi.advanceTimersByTimeAsync(30000);
        await flushSyncCycle();
      });
    },
    whenPingSucceedsWithInitializedFalse: (When: StepTest["When"]) => {
      When("ping succeeds with initialized=false", async () => {
        f.context.mockPing.mockResolvedValueOnce({
          ok: true,
          app: "Clear Progress",
          version: "1.0",
          initialized: false,
        });
        await vi.advanceTimersByTimeAsync(30000);
      });
    },
    whenPingFails: (When: StepTest["When"]) => {
      When("ping fails", async () => {
        f.context.mockPing.mockRejectedValueOnce(new Error("Ping failed"));
        await vi.advanceTimersByTimeAsync(30000);
      });
    },
    whenPingFailsMaxAttemptsTimes: (When: StepTest["When"]) => {
      When("ping fails MAX_PING_ATTEMPTS times consecutively", async () => {
        // MAX_PING_ATTEMPTS = 20
        for (let i = 0; i < 20; i++) {
          f.context.mockPing.mockRejectedValueOnce(new Error("Ping failed"));
          await vi.advanceTimersByTimeAsync(30000);
        }
      });
    },
    whenPeriodicSyncFailsWithNetworkError: (When: StepTest["When"]) => {
      When("periodic sync fails with a network error", async () => {
        f.context.mockPush.mockRejectedValueOnce(new Error("Network error"));
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
        await flushSyncCycle();
      });
    },
    whenSyncFailsWithAuthError: (And: StepTest["When"]) => {
      And("sync fails with an auth error", () => {
        // This step is for documentation only
        // The auth error was already configured and triggered in whenSyncProviderMountsWithAuthError
      });
    },
    whenSyncFailsWithAuthErrorMaxAttemptsTimes: (And: StepTest["When"]) => {
      And(
        "sync fails with an auth error MAX_SILENT_REFRESH_ATTEMPTS times",
        () => {
          // This step is for documentation only
          // The repeated auth errors were already configured and triggered in whenSyncProviderMountsWithRepeatedAuthErrors
        },
      );
    },
    whenNextSyncSucceeds: (When: StepTest["When"]) => {
      When("next sync succeeds", async () => {
        f.context.mockPush.mockResolvedValue(undefined);
        f.context.mockPull.mockResolvedValue(undefined);
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
        await flushSyncCycle();
        // Clear mocks after successful sync
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
      });
    },
    whenThenSyncFailsWithAuthErrorAgain: (And: StepTest["When"]) => {
      And("then sync fails with an auth error again", async () => {
        const authError = new Error("Unauthorized");
        authError.name = "ApiAuthError";
        f.context.mockPull.mockRejectedValueOnce(authError);
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
        await flushSyncCycle();
      });
    },
    whenPushAndPullSucceedButFileSyncThrowsError: (When: StepTest["When"]) => {
      When("push and pull succeed but file sync throws an error", async () => {
        f.context.mockPush.mockResolvedValueOnce(undefined);
        f.context.mockPull.mockResolvedValueOnce(undefined);
        f.context.mockFileSync.mockRejectedValueOnce(
          new Error("File sync failed"),
        );
        f.context.initialSyncVersion = 0;
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
        await flushSyncCycle();
      });
    },
  };
}
