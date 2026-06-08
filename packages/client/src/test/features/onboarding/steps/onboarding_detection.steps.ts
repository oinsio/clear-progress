// implements FR1, FR7, NFR-P1 of onboarding-goal
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { db } from "@/db/database";
import type { OnboardingService } from "@/services/OnboardingService";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";
import {
  assertOnboardingFlagSet,
  assertOnboardingNotShown,
  clearOnboardingState,
  createOnboardingService,
  runDetectionExpectingSkip,
} from "@/test/helpers/bdd/onboarding/helpers";

const feature = await loadFeature("../onboarding_detection.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let onboardingService: OnboardingService;
  let shouldShow: boolean;
  let detectionDurationMs: number;

  f.BeforeEachScenario(async () => {
    await clearOnboardingState();
    shouldShow = false;
    detectionDurationMs = 0;
    onboardingService = createOnboardingService();
  });

  // @onboarding-goal @FR1
  f.Scenario("Brand new user sees onboarding", ({ Given, And, When, Then }) => {
    Given("no localStorage flag exists", async (_ctx: TestContext) => {
      expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBeNull();
    });

    And("database is empty", async (_ctx: TestContext) => {
      const goalCount = await db.goals.count();
      const taskCount = await db.tasks.count();
      expect(goalCount).toBe(0);
      expect(taskCount).toBe(0);
    });

    When("detection runs", async (_ctx: TestContext) => {
      shouldShow = await onboardingService.shouldShowOnboarding();
      expect(shouldShow).toBe(true);
    });

    Then("onboarding should be shown", async (_ctx: TestContext) => {
      expect(shouldShow).toBe(true);
    });

    And("localStorage flag is not set", async (_ctx: TestContext) => {
      expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBeNull();
    });
  });

  // @onboarding-goal @FR1
  f.Scenario(
    "Returning user does not see onboarding",
    ({ Given, When, Then }) => {
      Given("localStorage flag exists", async (_ctx: TestContext) => {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_SHOWN, "true");
      });

      When("detection runs", async (_ctx: TestContext) => {
        shouldShow = await onboardingService.shouldShowOnboarding();
        expect(shouldShow).toBe(false);
      });

      Then("onboarding should not be shown", async (_ctx: TestContext) => {
        expect(shouldShow).toBe(false);
      });
    },
  );

  // @onboarding-goal @FR1 @FR7
  f.Scenario(
    "Existing goals without flag sets flag silently",
    ({ Given, And, When, Then }) => {
      Given("no localStorage flag exists", async (_ctx: TestContext) => {
        expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBeNull();
      });

      And("database has active goals", async (_ctx: TestContext) => {
        await db.goals.add(buildGoal({ name: "Existing Goal" }));
      });

      When("detection runs", async (_ctx: TestContext) => {
        shouldShow = await runDetectionExpectingSkip(onboardingService);
      });

      Then("onboarding should not be shown", async (_ctx: TestContext) => {
        assertOnboardingNotShown(shouldShow);
      });

      And('localStorage flag is set to "true"', async (_ctx: TestContext) => {
        assertOnboardingFlagSet();
      });
    },
  );

  // @onboarding-goal @FR1 @FR7
  f.Scenario(
    "Existing tasks without flag sets flag silently",
    ({ Given, And, When, Then }) => {
      Given("no localStorage flag exists", async (_ctx: TestContext) => {
        expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBeNull();
      });

      And("database has active tasks", async (_ctx: TestContext) => {
        await db.tasks.add(buildTask({ name: "Existing Task" }));
      });

      When("detection runs", async (_ctx: TestContext) => {
        shouldShow = await runDetectionExpectingSkip(onboardingService);
      });

      Then("onboarding should not be shown", async (_ctx: TestContext) => {
        assertOnboardingNotShown(shouldShow);
      });

      And('localStorage flag is set to "true"', async (_ctx: TestContext) => {
        assertOnboardingFlagSet();
      });
    },
  );

  // @onboarding-goal @FR1 @FR7
  f.Scenario(
    "Existing goals and tasks without flag sets flag silently",
    ({ Given, And, When, Then }) => {
      Given("no localStorage flag exists", async (_ctx: TestContext) => {
        expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBeNull();
      });

      And("database has active goals", async (_ctx: TestContext) => {
        await db.goals.add(buildGoal({ name: "Both Goal" }));
      });

      And("database has active tasks", async (_ctx: TestContext) => {
        await db.tasks.add(buildTask({ name: "Both Task" }));
      });

      When("detection runs", async (_ctx: TestContext) => {
        shouldShow = await runDetectionExpectingSkip(onboardingService);
      });

      Then("onboarding should not be shown", async (_ctx: TestContext) => {
        assertOnboardingNotShown(shouldShow);
      });

      And('localStorage flag is set to "true"', async (_ctx: TestContext) => {
        assertOnboardingFlagSet();
      });
    },
  );

  // @onboarding-goal @NFR-P1
  f.Scenario(
    "Detection completes within 100ms",
    ({ Given, And, When, Then }) => {
      Given("no localStorage flag exists", async (_ctx: TestContext) => {
        // Already cleared in BeforeEachScenario
      });

      And("database is empty", async (_ctx: TestContext) => {
        // Already cleared in BeforeEachScenario
      });

      When("detection runs with timing", async (_ctx: TestContext) => {
        const startTime = performance.now();
        shouldShow = await onboardingService.shouldShowOnboarding();
        detectionDurationMs = performance.now() - startTime;
        expect(shouldShow).toBe(true);
      });

      Then("detection completes in under 100ms", async (_ctx: TestContext) => {
        expect(detectionDurationMs).toBeLessThan(100);
      });
    },
  );
});
