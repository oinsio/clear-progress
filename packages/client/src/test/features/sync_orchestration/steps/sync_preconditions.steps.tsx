// implements sync-orchestration of sync-update
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen } from "@testing-library/react/pure";
import { vi } from "vitest";

// Re-export mocks from stepDefinitions to ensure they're applied before imports
import "@/test/helpers/bdd/syncOrchestration/stepDefinitions.tsx";

// Import components from the already-mocked modules via stepDefinitions
import { AlertProvider } from "@/app/providers/AlertProvider";
// Import mocked AuthProvider from the same module that's mocked in stepDefinitions
import { AuthProvider } from "@/app/providers/AuthProvider";
import { SyncProvider, useSync } from "@/app/providers/SyncProvider";
import {
  createBackgroundSteps,
  createThenSteps,
  createWhenSteps,
  setupScenarioHooks,
} from "@/test/helpers/bdd/syncOrchestration/stepDefinitions.tsx";
import type { SyncTestContext } from "@/test/helpers/bdd/syncOrchestration/types";

function SyncStatusDisplay() {
  const { syncStatus } = useSync();
  return <div data-testid="status">{syncStatus}</div>;
}

function SyncMethodTrigger() {
  const { pull, schedulePush } = useSync();
  return (
    <>
      <button data-testid="pull-btn" onClick={() => void pull()}>
        pull
      </button>
      <button data-testid="schedule-btn" onClick={schedulePush}>
        schedule
      </button>
    </>
  );
}

const feature = await loadFeature("../sync_preconditions.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<SyncTestContext>) => {
    setupScenarioHooks(f);

    const backgroundSteps = createBackgroundSteps(f);
    const whenSteps = createWhenSteps(f);
    const thenSteps = createThenSteps(f);

    // @sync-orchestration @precondition
    f.Scenario(
      "Sync is skipped when user is not authenticated",
      ({ Given, When, Then, And }) => {
        backgroundSteps.givenUserHasNoAccessToken(Given);

        whenSteps.whenSyncProviderMounts(When);

        Then("no sync cycle runs", () => {
          expect(f.context.mockPush).not.toHaveBeenCalled();
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });

        And("no periodic interval is started", async () => {
          await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
          expect(f.context.mockPush).not.toHaveBeenCalled();
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });
      },
    );

    // @sync-orchestration @precondition
    f.Scenario(
      "Sync sets offline status when navigator is offline",
      ({ Given, And, When, Then }) => {
        backgroundSteps.givenUserIsAuthenticated(Given);
        backgroundSteps.givenConnectionConfigIsActive(And);

        And("navigator is offline", () => {
          Object.defineProperty(navigator, "onLine", {
            writable: true,
            configurable: true,
            value: false,
          });
        });

        whenSteps.whenSyncProviderMounts(When);

        Then("no sync cycle runs", () => {
          expect(f.context.mockPush).not.toHaveBeenCalled();
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });

        thenSteps.thenSyncStatusBecomes(And, "offline");
      },
    );

    // @sync-orchestration @precondition
    f.Scenario(
      "Concurrent sync is dropped by mutex",
      ({ Given, And, When, Then }) => {
        backgroundSteps.givenUserIsAuthenticated(Given);
        backgroundSteps.givenConnectionConfigIsActive(And);
        backgroundSteps.givenNavigatorIsOnline(And);

        And("a sync cycle is already in progress", async () => {
          f.context.mockPush.mockImplementation(
            () =>
              new Promise((resolve) => {
                setTimeout(() => resolve(undefined), 999999);
              }),
          );
          f.context.mockPull.mockResolvedValue(undefined);

          const { unmount } = render(
            <AuthProvider>
              <AlertProvider>
                <SyncProvider>
                  <SyncStatusDisplay />
                  <SyncMethodTrigger />
                </SyncProvider>
              </AlertProvider>
            </AuthProvider>,
          );
          f.context.syncProviderUnmount = unmount;

          await vi.advanceTimersByTimeAsync(0);
          await vi.advanceTimersByTimeAsync(0);
        });

        When("another sync trigger fires", async () => {
          const scheduleBtn = screen.getByTestId("schedule-btn");
          scheduleBtn.click();
          await vi.advanceTimersByTimeAsync(15000);
          await vi.advanceTimersByTimeAsync(0);
        });

        Then("the second sync is skipped (not queued)", () => {
          expect(f.context.mockPush).toHaveBeenCalledTimes(1);
          expect(f.context.mockPull).not.toHaveBeenCalled();
        });
      },
    );
  },
);
