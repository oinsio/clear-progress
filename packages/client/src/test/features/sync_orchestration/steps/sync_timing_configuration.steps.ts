// implements FR3, FR4 of configurable-sync-timing
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

const feature = await loadFeature("../sync_timing_configuration.feature");

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

    // @configurable-sync-timing @FR3
    f.Scenario(
      "Periodic sync uses a configured non-default interval",
      ({ Given, And, When, Then }) => {
        givenSteps.givenSyncIntervalIsConfiguredToMinutes(Given, 2);
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
        whenSteps.whenTimePassesMinutes(When, 2);
        thenSteps.thenSyncCycleIsExecuted(Then);
      },
    );

    // @configurable-sync-timing @FR3
    f.Scenario(
      "Periodic sync is disabled when sync_interval is empty",
      ({ Given, And, When, Then }) => {
        givenSteps.givenSyncIntervalIsConfiguredToEmpty(Given);
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
        whenSteps.whenTimePassesHours(When, 24);
        thenSteps.thenNoPeriodicSyncCycleExecutes(Then);
      },
    );

    // @configurable-sync-timing @FR3 @D7
    f.Scenario(
      "Periodic interval updates after a pull delivers a new sync_interval value",
      ({ Given, And, When, Then }) => {
        givenSteps.givenSyncIntervalIsConfiguredToMinutes(Given, 2);
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
        whenSteps.whenAPullDeliversNewSyncIntervalValue(When, 4);
        thenSteps.thenStaleCadenceNoLongerTriggersSync(Then, 2);
        thenSteps.thenPeriodicSyncFollowsNewCadence(And, 4, 2);
      },
    );

    // @configurable-sync-timing @FR4
    f.Scenario(
      "Debounced sync uses a configured non-default delay",
      ({ Given, And, When, Then }) => {
        givenSteps.givenAutoSyncDelayIsConfiguredToSeconds(Given, 3);
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
        whenSteps.whenUserMutatesLocalData(When);
        thenSteps.thenNoSyncCycleRunsImmediately(Then);
        whenSteps.whenTimePassesSeconds(When, 3);
        thenSteps.thenSyncCycleIsExecuted(Then);
      },
    );

    // @configurable-sync-timing @FR4
    f.Scenario(
      "Debounced sync fires immediately when auto_sync_delay is 0",
      ({ Given, And, When, Then }) => {
        givenSteps.givenAutoSyncDelayIsConfiguredToSeconds(Given, 0);
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
        whenSteps.whenUserMutatesLocalData(When);
        thenSteps.thenSyncCycleIsExecuted(Then);
      },
    );

    // @configurable-sync-timing @FR4 @D7
    f.Scenario(
      "Debounce delay updates after a pull delivers a new auto_sync_delay value",
      ({ Given, And, When, Then }) => {
        givenSteps.givenAutoSyncDelayIsConfiguredToSeconds(Given, 30);
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
        whenSteps.whenAPullDeliversNewAutoSyncDelayValue(When, 5);
        whenSteps.whenUserMutatesLocalData(And);
        thenSteps.thenNoSyncCycleRunsImmediately(Then);
        whenSteps.whenTimePassesSeconds(When, 5);
        thenSteps.thenSyncCycleIsExecuted(Then);
      },
    );
  },
);
