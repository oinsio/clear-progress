// implements FR2, FR4, FR7 of onboarding-goal
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { ONBOARDING_TEMPLATE } from "@/constants/onboardingTemplate";
import { db } from "@/db/database";
import type { OnboardingService } from "@/services/OnboardingService";
import {
  clearOnboardingState,
  createOnboardingService,
} from "@/test/helpers/bdd/onboarding/helpers";
import type { Goal, Task } from "@/types/entities";

const feature = await loadFeature("../onboarding_creation.feature");

const MOCK_TRANSLATIONS: Record<string, string> = {
  "onboarding.goalName": "Test Goal Name",
  "onboarding.goalDescription": "Test Goal Description",
  "onboarding.task1Name": "Task 1",
  "onboarding.task1Description": "Task 1 Description",
  "onboarding.task2Name": "Task 2",
  "onboarding.task2Description": "Task 2 Description",
  "onboarding.task3Name": "Task 3",
  "onboarding.task3Description": "Task 3 Description",
  "onboarding.task4Name": "Task 4",
  "onboarding.task4Description": "Task 4 Description",
  "onboarding.task5Name": "Task 5",
  "onboarding.task5Description": "Task 5 Description",
};

const mockTranslate = (key: string): string => MOCK_TRANSLATIONS[key] ?? key;

type Context = Record<string, never>;

interface OnboardingCreationResult {
  goals: Goal[];
  tasks: Task[];
}

const createAndVerifyOnboardingEntities = async (
  onboardingService: OnboardingService,
): Promise<OnboardingCreationResult> => {
  await onboardingService.createOnboardingEntities(mockTranslate);
  const goals = await db.goals.toArray();
  const tasks = await db.tasks.toArray();
  expect(goals).toHaveLength(1);
  expect(tasks).toHaveLength(ONBOARDING_TEMPLATE.tasks.length);
  return { goals, tasks };
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let onboardingService: OnboardingService;
  let createdGoals: Goal[];
  let createdTasks: Task[];

  f.BeforeEachScenario(async () => {
    await clearOnboardingState();
    createdGoals = [];
    createdTasks = [];
    onboardingService = createOnboardingService();
  });

  // @onboarding-goal @FR2
  f.Scenario("Goal created with correct attributes", ({ When, Then, And }) => {
    When("onboarding entities are created", async (_ctx: TestContext) => {
      const result = await createAndVerifyOnboardingEntities(onboardingService);
      createdGoals = result.goals;
      createdTasks = result.tasks;
    });

    Then("a goal exists with localized name", async (_ctx: TestContext) => {
      expect(createdGoals).toHaveLength(1);
      expect(createdGoals[0].name).toBe("Test Goal Name");
    });

    And("goal has localized description", async (_ctx: TestContext) => {
      expect(createdGoals[0].description).toBe("Test Goal Description");
    });

    And('goal has status "in_progress"', async (_ctx: TestContext) => {
      expect(createdGoals[0].status).toBe("in_progress");
    });
  });

  // @onboarding-goal @FR2
  f.Scenario(
    "Tasks created with correct box assignments",
    ({ When, Then, And }) => {
      When("onboarding entities are created", async (_ctx: TestContext) => {
        const result =
          await createAndVerifyOnboardingEntities(onboardingService);
        createdGoals = result.goals;
        createdTasks = result.tasks;
      });

      Then("5 tasks are created", async (_ctx: TestContext) => {
        expect(createdTasks).toHaveLength(5);
      });

      And('task 1 is in box "today"', async (_ctx: TestContext) => {
        const sortedTasks = [...createdTasks].sort((taskA, taskB) =>
          (() => {
            const keyA = String(taskA.sort_order);
            const keyB = String(taskB.sort_order);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          })(),
        );
        expect(sortedTasks[0]?.box).toBe("today");
      });

      And('tasks 2 through 5 are in box "later"', async (_ctx: TestContext) => {
        const sortedTasks = [...createdTasks].sort((taskA, taskB) =>
          (() => {
            const keyA = String(taskA.sort_order);
            const keyB = String(taskB.sort_order);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          })(),
        );
        const laterTasks = sortedTasks.slice(1);
        expect(laterTasks).toHaveLength(4);
        for (const task of laterTasks) {
          expect(task.box).toBe("later");
        }
      });

      And(
        "all tasks are linked to the onboarding goal",
        async (_ctx: TestContext) => {
          const goalId = createdGoals[0].id;
          for (const task of createdTasks) {
            expect(task.goal_id).toBe(goalId);
          }
        },
      );
    },
  );

  // @onboarding-goal @FR4
  f.Scenario("Tasks have correct sort order", ({ When, Then }) => {
    When("onboarding entities are created", async (_ctx: TestContext) => {
      const result = await createAndVerifyOnboardingEntities(onboardingService);
      createdTasks = result.tasks;
    });

    Then("tasks are ordered 0 through 4", async (_ctx: TestContext) => {
      const sortOrders = createdTasks
        .map((task) => String(task.sort_order))
        .sort((orderA, orderB) => {
          if (orderA < orderB) return -1;
          if (orderA > orderB) return 1;
          return 0;
        });
      expect(sortOrders).toHaveLength(5);
      // Verify all sort_orders are unique and in ascending order
      for (let i = 1; i < sortOrders.length; i++) {
        expect(sortOrders[i] > sortOrders[i - 1]).toBe(true);
      }
    });
  });

  // @onboarding-goal @FR7
  f.Scenario("Flag is set after creation", ({ When, Then }) => {
    When("onboarding entities are created", async (_ctx: TestContext) => {
      const result = await createAndVerifyOnboardingEntities(onboardingService);
      createdGoals = result.goals;
      createdTasks = result.tasks;
      expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBe("true");
    });

    Then('localStorage flag is set to "true"', async (_ctx: TestContext) => {
      expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN)).toBe("true");
    });
  });

  // @onboarding-goal @FR2
  f.Scenario(
    "Tasks use translated names and descriptions",
    ({ When, Then, And }) => {
      When("onboarding entities are created", async (_ctx: TestContext) => {
        const result =
          await createAndVerifyOnboardingEntities(onboardingService);
        createdTasks = result.tasks;
      });

      Then("each task has a translated name", async (_ctx: TestContext) => {
        const sortedTasks = [...createdTasks].sort((taskA, taskB) =>
          (() => {
            const keyA = String(taskA.sort_order);
            const keyB = String(taskB.sort_order);
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
          })(),
        );
        expect(sortedTasks[0].name).toBe("Task 1");
        expect(sortedTasks[1].name).toBe("Task 2");
        expect(sortedTasks[2].name).toBe("Task 3");
        expect(sortedTasks[3].name).toBe("Task 4");
        expect(sortedTasks[4].name).toBe("Task 5");
      });

      And(
        "each task has a translated description",
        async (_ctx: TestContext) => {
          const sortedTasks = [...createdTasks].sort((taskA, taskB) =>
            (() => {
              const keyA = String(taskA.sort_order);
              const keyB = String(taskB.sort_order);
              if (keyA < keyB) return -1;
              if (keyA > keyB) return 1;
              return 0;
            })(),
          );
          expect(sortedTasks[0].description).toBe("Task 1 Description");
          expect(sortedTasks[1].description).toBe("Task 2 Description");
          expect(sortedTasks[2].description).toBe("Task 3 Description");
          expect(sortedTasks[3].description).toBe("Task 4 Description");
          expect(sortedTasks[4].description).toBe("Task 5 Description");
        },
      );
    },
  );
});
