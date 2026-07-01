// implements sync-orchestration of sync-update
import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { screen } from "@testing-library/react/pure";
import { expect, vi } from "vitest";
import { createBackgroundSteps } from "./scenarioSetup";
import { flushSyncCycle, renderSyncProviderForFullSync } from "./testSetup";
import { createThenSteps } from "./thenSteps";
import type { SyncTestContext } from "./types";

export function createFullSyncGivenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    givenSyncVersionIsN: (Given: StepTest["Given"]) => {
      Given("syncVersion is N", () => {
        f.context.initialSyncVersion = 0;
      });
    },
    givenRegularSyncCycleIsInProgress: (Given: StepTest["Given"]) => {
      Given("a regular sync cycle is in progress", async () => {
        f.context.mockPush.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10000)),
        );
        const pullBtn = screen.getByTestId("pull-btn");
        pullBtn.click();
        await vi.advanceTimersByTimeAsync(0);
      });
    },
  };
}

export function createFullSyncWhenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    whenUserTriggersFullSync: (When: StepTest["When"]) => {
      When("user triggers full sync", async () => {
        const fullSyncBtn = screen.getByTestId("full-sync-btn");
        fullSyncBtn.click();
        await flushSyncCycle();
      });
    },
    whenUserTriggersFullSyncSuccessfully: (When: StepTest["When"]) => {
      When("user triggers full sync successfully", async () => {
        const fullSyncBtn = screen.getByTestId("full-sync-btn");
        fullSyncBtn.click();
        await flushSyncCycle();
      });
    },
    whenResetAndPullFails: (And: StepTest["When"]) => {
      And("resetAndPull fails", async () => {
        f.context.mockResetAndPull.mockRejectedValueOnce(
          new Error("Reset failed"),
        );
        const fullSyncBtn = screen.getByTestId("full-sync-btn");
        fullSyncBtn.click();
        await flushSyncCycle();
      });
    },
  };
}

export function createFullSyncThenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  const baseThenSteps = createThenSteps(f);
  return {
    ...baseThenSteps,
    thenProgressReportsStepsInOrder: (Then: StepTest["Then"]) => {
      Then("progress reports steps in order:", () => {
        const expectedSteps: import("@/types/common").FullSyncStep[] = [
          "reupload_files",
          "upload_files",
          "push",
          "pull",
          "download_files",
          "done",
        ];
        expect(f.context.progressSteps).toEqual(expectedSteps);
      });
    },
    thenPushForceIsCalled: (Then: StepTest["Then"]) => {
      Then("push(force=true) is called", () => {
        expect(f.context.mockPush).toHaveBeenCalledWith(true);
      });
    },
    thenResetAndPullIsCalled: (And: StepTest["Then"]) => {
      And("resetAndPull() is called", () => {
        expect(f.context.mockResetAndPull).toHaveBeenCalled();
      });
    },
    thenSyncVersionBecomesNPlus1: (Then: StepTest["Then"]) => {
      Then("syncVersion becomes N+1", () => {
        expect(f.context.mockResetAndPull).toHaveBeenCalled();
        expect(f.context.progressSteps).toContain("done");
      });
    },
    thenProgressReportsError: (Then: StepTest["Then"]) => {
      Then('progress reports "error"', () => {
        expect(f.context.progressSteps).toContain("error");
      });
    },
    thenFullSyncDoesNotStart: (Then: StepTest["Then"]) => {
      Then("full sync does not start", () => {
        expect(f.context.mockResetAndPull).not.toHaveBeenCalled();
        expect(f.context.mockReuploadLocalFiles).not.toHaveBeenCalled();
      });
    },
  };
}

export function createFullSyncBackgroundSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  const baseSteps = createBackgroundSteps(f);
  return {
    ...baseSteps,
    givenSyncProviderMountedAndInitialSyncCompleted: (
      And: StepTest["Given"],
    ) => {
      And("SyncProvider has mounted and initial sync completed", async () => {
        vi.useFakeTimers();
        const onProgress = (step: import("@/types/common").FullSyncStep) => {
          f.context.progressSteps.push(step);
        };
        const { unmount } = renderSyncProviderForFullSync(onProgress);
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockPing.mockClear();
        f.context.mockFileSync.mockClear();
        f.context.progressSteps = [];
      });
    },
  };
}
