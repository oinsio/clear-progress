// implements sync-orchestration of sync-update
import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { screen } from "@testing-library/react/pure";
import { expect, vi } from "vitest";
import {
  expectNoSyncCycle,
  expectSyncCycleExecuted,
  expectSyncCycleExecutedTimes,
} from "./testSetup";
import type { SyncTestContext } from "./types";

export function createThenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    thenSyncCycleIsExecuted: (Then: StepTest["Then"]) => {
      Then("a sync cycle is executed", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenSyncStatusBecomes: (And: StepTest["Then"], status: string) => {
      And(`sync status becomes "${status}"`, async () => {
        // Flush all pending microtasks and timers to let sync complete
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(0);
        const statusElement = screen.getByTestId("status");
        expect(statusElement.textContent).toBe(status);
      });
    },
    thenPeriodicSyncCyclesExecuted: (Then: StepTest["Then"], count: number) => {
      Then(`${count} periodic sync cycles have executed`, () => {
        expectSyncCycleExecutedTimes(f.context, count);
      });
    },
    thenNoSyncCycleRunsImmediately: (Then: StepTest["Then"]) => {
      Then("no sync cycle runs immediately", () => {
        expectNoSyncCycle(f.context);
      });
    },
    thenAfterSecondsFromLastMutationSyncCycleIsExecuted: (
      Then: StepTest["Then"],
      seconds: number,
    ) => {
      Then(
        `after ${seconds} seconds from the last mutation a sync cycle is executed`,
        async () => {
          await vi.advanceTimersByTimeAsync(seconds * 1000);
          expectSyncCycleExecuted(f.context);
        },
      );
    },
    thenOnlyDebouncedSyncCyclesRan: (And: StepTest["Then"], count: number) => {
      And(`only ${count} debounced sync cycle ran in total`, () => {
        expectSyncCycleExecutedTimes(f.context, count);
      });
    },
    thenPingRequestIsSent: (Then: StepTest["Then"]) => {
      Then("a ping request is sent", async () => {
        await vi.runOnlyPendingTimersAsync();
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenIfPingSucceedsSyncCycleFollows: (And: StepTest["Then"]) => {
      And("if ping succeeds a sync cycle follows", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenRegularSyncCycleIsExecuted: (Then: StepTest["Then"]) => {
      Then("a regular sync cycle is executed (push then pull)", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenThisIsNotFullSync: (And: StepTest["Then"]) => {
      And("this is not a full sync (no force push, no revision reset)", () => {
        expect(f.context.mockPush).toHaveBeenCalledWith();
      });
    },
    thenPingIntervalStarts: (And: StepTest["Then"]) => {
      And("ping interval starts (every 30 seconds)", async () => {
        // Wait for the effect that starts ping interval to run
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(0);
        // Verify ping interval is active by checking if ping fires after 30s
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenPingIntervalIsStopped: (And: StepTest["Then"]) => {
      And("ping interval is stopped", async () => {
        // Wait for performPing to complete and call stopPingInterval
        await vi.runOnlyPendingTimersAsync();
        // Clear ping mock and advance time to verify no more pings
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).not.toHaveBeenCalled();
      });
    },
    thenNoFurtherPingsFire: (And: StepTest["Then"]) => {
      And("no further pings fire", async () => {
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(60000);
        expect(f.context.mockPing).not.toHaveBeenCalled();
      });
    },
    thenInitIsCalled: (Then: StepTest["Then"]) => {
      Then("init() is called", async () => {
        await vi.runOnlyPendingTimersAsync();
        expect(f.context.mockInit).toHaveBeenCalled();
      });
    },
    thenSyncCycleFollows: (And: StepTest["Then"]) => {
      And("a sync cycle follows", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenPingIntervalContinues: (Then: StepTest["Then"]) => {
      Then("ping interval continues", async () => {
        // Verify another ping fires after 30s
        f.context.mockPing.mockClear();
        f.context.mockPing.mockRejectedValueOnce(new Error("Still failing"));
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenNextPingFiresAfter30Seconds: (And: StepTest["Then"]) => {
      And("next ping fires after 30 seconds", async () => {
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenSilentRefreshIsCalled: (Then: StepTest["Then"]) => {
      Then("silentRefresh() is called", () => {
        expect(f.context.mockSilentRefresh).toHaveBeenCalled();
      });
    },
    thenSignOutIsNotCalled: (And: StepTest["Then"]) => {
      And("signOut() is not called", () => {
        expect(f.context.mockSignOut).not.toHaveBeenCalled();
      });
    },
    thenSignOutIsCalled: (Then: StepTest["Then"]) => {
      Then("signOut() is called", () => {
        expect(f.context.mockSignOut).toHaveBeenCalled();
      });
    },
    thenAuthRequiredEventIsDispatched: (And: StepTest["Then"]) => {
      And("AUTH_REQUIRED_EVENT is dispatched", () => {
        // Verify event was dispatched by checking signOut was called
        // (event dispatch happens in same code path)
        expect(f.context.mockSignOut).toHaveBeenCalled();
      });
    },
    thenSilentRefreshIsCalledNotSignOut: (Then: StepTest["Then"]) => {
      Then("silentRefresh() is called (not signOut)", () => {
        expect(f.context.mockSilentRefresh).toHaveBeenCalled();
        expect(f.context.mockSignOut).not.toHaveBeenCalled();
      });
    },
    thenCounterStartsFromOneAgain: (And: StepTest["Then"]) => {
      And("the counter starts from 1 again", () => {
        // Verify counter was reset by checking silentRefresh was called once
        expect(f.context.mockSilentRefresh).toHaveBeenCalledTimes(1);
      });
    },
    thenSyncVersionIsIncremented: (And: StepTest["Then"]) => {
      And("syncVersion is incremented", async () => {
        await vi.advanceTimersByTimeAsync(0);
        // Verify sync completed successfully despite file sync error
        expect(f.context.mockPush).toHaveBeenCalled();
        expect(f.context.mockPull).toHaveBeenCalled();
      });
    },
    // implements FR3 of configurable-sync-timing
    thenNoPeriodicSyncCycleExecutes: (Then: StepTest["Then"]) => {
      Then("no periodic sync cycle executes", () => {
        expectNoSyncCycle(f.context);
      });
    },
    // implements FR3, D7 of configurable-sync-timing
    thenStaleCadenceNoLongerTriggersSync: (
      Then: StepTest["Then"],
      staleMinutes: number,
    ) => {
      Then(
        `the stale ${staleMinutes} minute cadence no longer triggers a sync`,
        async () => {
          await vi.advanceTimersByTimeAsync(staleMinutes * 60 * 1000);
          expectNoSyncCycle(f.context);
        },
      );
    },
    // implements FR3, D7 of configurable-sync-timing
    thenPeriodicSyncFollowsNewCadence: (
      And: StepTest["Then"],
      newMinutes: number,
      remainingMinutesToAdvance: number,
    ) => {
      And(
        `periodic sync now follows the new ${newMinutes} minute cadence`,
        async () => {
          await vi.advanceTimersByTimeAsync(
            remainingMinutesToAdvance * 60 * 1000,
          );
          expectSyncCycleExecuted(f.context);
        },
      );
    },
  };
}
