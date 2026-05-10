// implements sync-orchestration of sync-update
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  createBackgroundSteps,
  createGivenSteps,
  createThenSteps,
  createWhenSteps,
  setupScenarioHooks,
} from "@/test/helpers/bdd/syncOrchestration/stepDefinitions.tsx";
import type { SyncTestContext } from "@/test/helpers/bdd/syncOrchestration/types";

const feature = await loadFeature("../sync_error_handling.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<SyncTestContext>) => {
    setupScenarioHooks(f);

    const backgroundSteps = createBackgroundSteps(f);
    const givenSteps = createGivenSteps(f);
    const whenSteps = createWhenSteps(f);
    const thenSteps = createThenSteps(f);

    f.Background(({ Given, And }) => {
      backgroundSteps.givenUserIsAuthenticated(Given);
      backgroundSteps.givenConnectionConfigIsActive(And);
      backgroundSteps.givenNavigatorIsOnline(And);
    });

    // @sync-orchestration @error-handling
    f.Scenario("Network error sets error status", ({ Given, When, Then }) => {
      givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
      whenSteps.whenPeriodicSyncFailsWithNetworkError(When);
      thenSteps.thenSyncStatusBecomes(Then, "error");
    });

    // @sync-orchestration @error-handling
    f.Scenario(
      "First auth error triggers silent refresh",
      ({ When, Then, And }) => {
        whenSteps.whenSyncProviderMountsWithAuthError(When);
        whenSteps.whenSyncFailsWithAuthError(And);
        thenSteps.thenSilentRefreshIsCalled(Then);
        thenSteps.thenSignOutIsNotCalled(And);
        thenSteps.thenSyncStatusBecomes(And, "unauthorized");
      },
    );

    // @sync-orchestration @error-handling
    f.Scenario(
      "Repeated auth errors trigger sign out",
      ({ When, And, Then }) => {
        whenSteps.whenSyncProviderMountsWithRepeatedAuthErrors(When);
        whenSteps.whenSyncFailsWithAuthErrorMaxAttemptsTimes(And);
        thenSteps.thenSignOutIsCalled(Then);
        thenSteps.thenAuthRequiredEventIsDispatched(And);
      },
    );

    // @sync-orchestration @error-handling
    f.Scenario(
      "Auth error counter resets after successful sync",
      ({ Given, When, And, Then }) => {
        givenSteps.givenSyncHasFailedWithOneAuthError(Given);
        whenSteps.whenNextSyncSucceeds(When);
        whenSteps.whenThenSyncFailsWithAuthErrorAgain(And);
        thenSteps.thenSilentRefreshIsCalledNotSignOut(Then);
        thenSteps.thenCounterStartsFromOneAgain(And);
      },
    );

    // @sync-orchestration @error-handling
    f.Scenario(
      "Cover sync error does not fail the sync cycle",
      ({ Given, When, Then, And }) => {
        givenSteps.givenSyncProviderHasMounted(Given);
        whenSteps.whenPushAndPullSucceedButCoverSyncThrowsError(When);
        thenSteps.thenSyncStatusBecomes(Then, "idle");
        thenSteps.thenSyncVersionIsIncremented(And);
      },
    );
  },
);
