// implements sync-orchestration of reduce-sync-triggers
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  createFullSyncBackgroundSteps,
  createFullSyncGivenSteps,
  createFullSyncThenSteps,
  createFullSyncWhenSteps,
  setupScenarioHooks,
} from "@/test/helpers/bdd/syncOrchestration/stepDefinitions.tsx";
import type { SyncTestContext } from "@/test/helpers/bdd/syncOrchestration/types";

const feature = await loadFeature("../sync_full.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<SyncTestContext>) => {
    setupScenarioHooks(f);

    const backgroundSteps = createFullSyncBackgroundSteps(f);
    const givenSteps = createFullSyncGivenSteps(f);
    const whenSteps = createFullSyncWhenSteps(f);
    const thenSteps = createFullSyncThenSteps(f);

    f.Background(({ Given, And }) => {
      backgroundSteps.givenUserIsAuthenticated(Given);
      backgroundSteps.givenConnectionConfigIsActive(And);
      backgroundSteps.givenNavigatorIsOnline(And);
      backgroundSteps.givenSyncProviderMountedAndInitialSyncCompleted(And);
    });

    f.Scenario("Full sync executes all steps in order", ({ When, Then }) => {
      whenSteps.whenUserTriggersFullSync(When);
      thenSteps.thenProgressReportsStepsInOrder(Then);
    });

    f.Scenario(
      "Full sync uses force push and reset pull",
      ({ When, Then, And }) => {
        whenSteps.whenUserTriggersFullSync(When);
        thenSteps.thenPushForceIsCalled(Then);
        thenSteps.thenResetAndPullIsCalled(And);
      },
    );

    f.Scenario(
      "Full sync increments sync version on success",
      ({ Given, When, Then }) => {
        givenSteps.givenSyncVersionIsN(Given);
        whenSteps.whenUserTriggersFullSyncSuccessfully(When);
        thenSteps.thenSyncVersionBecomesNPlus1(Then);
      },
    );

    f.Scenario("Full sync reports error on failure", ({ When, And, Then }) => {
      whenSteps.whenUserTriggersFullSync(When);
      whenSteps.whenResetAndPullFails(And);
      thenSteps.thenProgressReportsError(Then);
      thenSteps.thenSyncStatusBecomes(And, "error");
    });

    f.Scenario(
      "Full sync is blocked by active regular sync",
      ({ Given, When, Then }) => {
        givenSteps.givenRegularSyncCycleIsInProgress(Given);
        whenSteps.whenUserTriggersFullSync(When);
        thenSteps.thenFullSyncDoesNotStart(Then);
      },
    );
  },
);
