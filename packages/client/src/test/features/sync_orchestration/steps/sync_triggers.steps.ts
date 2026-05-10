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

const feature = await loadFeature("../sync_triggers.feature");

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

    // @sync-orchestration @T1
    f.Scenario("Sync runs on application start", ({ When, Then, And }) => {
      whenSteps.whenSyncProviderMounts(When);
      thenSteps.thenSyncCycleIsExecuted(Then);
      thenSteps.thenSyncStatusBecomes(And, "idle");
    });

    // @sync-orchestration @T2
    f.Scenario("Sync runs periodically", ({ Given, When, Then }) => {
      givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
      whenSteps.whenTimePassesMinutes(When, 5);
      thenSteps.thenSyncCycleIsExecuted(Then);
    });

    // @sync-orchestration @T2
    f.Scenario("Periodic sync continues firing", ({ Given, When, Then }) => {
      givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
      whenSteps.whenTimePassesMinutes(When, 10);
      thenSteps.thenPeriodicSyncCyclesExecuted(Then, 2);
    });

    // @sync-orchestration @T3
    f.Scenario(
      "Sync runs after data mutation with debounce",
      ({ Given, When, Then }) => {
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
        whenSteps.whenUserMutatesLocalData(When);
        thenSteps.thenNoSyncCycleRunsImmediately(Then);
        whenSteps.whenTimePassesSeconds(When, 15);
        thenSteps.thenSyncCycleIsExecuted(Then);
      },
    );

    // @sync-orchestration @T3
    f.Scenario(
      "Multiple mutations within debounce window cause only one sync",
      ({ Given, When, Then, And }) => {
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
        whenSteps.whenUserMutatesLocalData(When);
        whenSteps.whenUserMutatesLocalDataAfterSeconds(And, 5);
        thenSteps.thenAfterSecondsFromLastMutationSyncCycleIsExecuted(Then, 15);
        thenSteps.thenOnlyDebouncedSyncCyclesRan(And, 1);
      },
    );

    // @sync-orchestration @T4
    f.Scenario(
      "Ping fires when browser comes online",
      ({ Given, When, Then, And }) => {
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
        whenSteps.whenBrowserFiresOnlineEvent(When);
        thenSteps.thenPingRequestIsSent(Then);
        thenSteps.thenIfPingSucceedsSyncCycleFollows(And);
      },
    );

    // @sync-orchestration @T6
    f.Scenario(
      "Sync runs when user clicks sync indicator",
      ({ Given, When, Then, And }) => {
        givenSteps.givenSyncProviderMountedAndInitialSyncCompleted(Given);
        whenSteps.whenUserClicksSyncIndicator(When);
        thenSteps.thenRegularSyncCycleIsExecuted(Then);
        thenSteps.thenThisIsNotFullSync(And);
      },
    );
  },
);
