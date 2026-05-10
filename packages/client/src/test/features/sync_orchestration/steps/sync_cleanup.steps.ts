// implements sync-orchestration of sync-update
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { screen } from "@testing-library/react/pure";
import { expect, vi } from "vitest";
import {
  createBackgroundSteps,
  createGivenSteps,
  setupScenarioHooks,
} from "@/test/helpers/bdd/syncOrchestration/stepDefinitions.tsx";
import type { SyncTestContext } from "@/test/helpers/bdd/syncOrchestration/types";

const feature = await loadFeature("../sync_cleanup.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<SyncTestContext>) => {
    setupScenarioHooks(f);

    const backgroundSteps = createBackgroundSteps(f);
    const givenSteps = createGivenSteps(f);

    f.Background(({ Given, And }) => {
      backgroundSteps.givenUserIsAuthenticated(Given);
      backgroundSteps.givenConnectionConfigIsActive(And);
      backgroundSteps.givenNavigatorIsOnline(And);
    });

    // @sync-orchestration @cleanup
    f.Scenario(
      "All timers are cleared on unmount",
      ({ Given, When, Then, And }) => {
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
        When("SyncProvider unmounts", () => {
          if (f.context.syncProviderUnmount) {
            f.context.syncProviderUnmount();
          }
        });
        Then("periodic sync interval is cleared", async () => {
          f.context.mockPush.mockClear();
          f.context.mockPull.mockClear();
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
          expect(f.context.mockPush).not.toHaveBeenCalled();
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });
        And("no more periodic syncs fire", async () => {
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
          expect(f.context.mockPush).not.toHaveBeenCalled();
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });
      },
    );

    // @sync-orchestration @cleanup
    f.Scenario(
      "Ping interval is cleared on unmount",
      ({ Given, And, When, Then }) => {
        givenSteps.givenNavigatorIsOffline(Given);
        givenSteps.givenSyncProviderHasMounted(And);
        And("ping interval is active", async () => {
          // Wait for ping interval to start
          await vi.advanceTimersByTimeAsync(0);
          await vi.advanceTimersByTimeAsync(0);
          // Verify ping interval is active by checking if ping fires after 30s
          f.context.mockPing.mockClear();
          await vi.advanceTimersByTimeAsync(30000);
          expect(f.context.mockPing).toHaveBeenCalled();
          f.context.mockPing.mockClear();
        });
        When("SyncProvider unmounts", () => {
          if (f.context.syncProviderUnmount) {
            f.context.syncProviderUnmount();
          }
        });
        Then("no more pings fire", async () => {
          await vi.advanceTimersByTimeAsync(30000);
          expect(f.context.mockPing).not.toHaveBeenCalled();
          await vi.advanceTimersByTimeAsync(30000);
          expect(f.context.mockPing).not.toHaveBeenCalled();
        });
      },
    );

    // @sync-orchestration @cleanup
    f.Scenario(
      "Debounce timer is cleared on unmount without triggering sync",
      ({ Given, And, When, Then }) => {
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
        And(
          "user has called schedulePush (debounce timer pending)",
          async () => {
            const scheduleBtn = screen.getByTestId("schedule-btn");
            scheduleBtn.click();
            await vi.advanceTimersByTimeAsync(0);
            f.context.mockPush.mockClear();
            f.context.mockPull.mockClear();
          },
        );
        When("SyncProvider unmounts", () => {
          if (f.context.syncProviderUnmount) {
            f.context.syncProviderUnmount();
          }
        });
        And("15 seconds pass", async () => {
          await vi.advanceTimersByTimeAsync(15000);
        });
        Then("no sync cycle runs", () => {
          expect(f.context.mockPush).not.toHaveBeenCalled();
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });
      },
    );
  },
);
