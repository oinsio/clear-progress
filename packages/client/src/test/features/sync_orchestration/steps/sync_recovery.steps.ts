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

const feature = await loadFeature("../sync_recovery.feature");

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
    });

    // @sync-orchestration @T5
    f.Scenario(
      "Ping interval starts when sync fails with network error",
      ({ Given, When, And, Then }) => {
        backgroundSteps.givenNavigatorIsOnline(Given);
        whenSteps.whenSyncProviderMounts(When);
        whenSteps.whenSyncFailsWithNetworkError(And);
        thenSteps.thenSyncStatusBecomes(Then, "error");
        thenSteps.thenPingIntervalStarts(And);
      },
    );

    // @sync-orchestration @T5
    f.Scenario(
      "Ping interval starts when navigator is offline at mount",
      ({ Given, When, Then, And }) => {
        givenSteps.givenNavigatorIsOffline(Given);
        whenSteps.whenSyncProviderMounts(When);
        thenSteps.thenSyncStatusBecomes(Then, "offline");
        thenSteps.thenPingIntervalStarts(And);
      },
    );

    // @sync-orchestration @T5
    f.Scenario(
      "Successful ping triggers sync and stops interval",
      ({ Given, When, Then, And }) => {
        givenSteps.givenPingIntervalIsActive(Given);
        whenSteps.whenPingSucceedsWithInitializedTrue(When);
        thenSteps.thenSyncCycleIsExecuted(Then);
        thenSteps.thenPingIntervalIsStopped(And);
        thenSteps.thenNoFurtherPingsFire(And);
      },
    );

    // @sync-orchestration @T5
    f.Scenario(
      "Ping calls init when server reports not initialized",
      ({ Given, When, Then, And }) => {
        givenSteps.givenPingIntervalIsActive(Given);
        whenSteps.whenPingSucceedsWithInitializedFalse(When);
        thenSteps.thenInitIsCalled(Then);
        thenSteps.thenSyncCycleFollows(And);
      },
    );

    // @sync-orchestration @T5
    f.Scenario(
      "Failed ping continues the interval",
      ({ Given, When, Then, And }) => {
        givenSteps.givenPingIntervalIsActive(Given);
        whenSteps.whenPingFails(When);
        thenSteps.thenPingIntervalContinues(Then);
        thenSteps.thenNextPingFiresAfter30Seconds(And);
      },
    );

    // @sync-orchestration @T5
    f.Scenario(
      "Ping stops after max attempts",
      ({ Given, When, Then, And }) => {
        givenSteps.givenPingIntervalIsActive(Given);
        whenSteps.whenPingFailsMaxAttemptsTimes(When);
        thenSteps.thenPingIntervalIsStopped(Then);
        thenSteps.thenNoFurtherPingsFire(And);
      },
    );
  },
);
