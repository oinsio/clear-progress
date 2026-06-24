// implements FR1, FR2 of miss-behavior-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { GroupedCompletedTasks } from "@/shared/lib/utils";
import { groupCompletedTasks } from "@/shared/lib/utils";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../completed_page_grouping.feature");

const FIXED_TIME = "2026-06-24T12:00:00Z";

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let clock: ReturnType<typeof fakeClock>;
    let tasks: Task[];
    let grouped: GroupedCompletedTasks;

    f.BeforeEachScenario(() => {
      tasks = [];
    });

    f.Background(({ Given }) => {
      Given(`the current time is "${FIXED_TIME}"`, (_ctx: TestContext) => {
        clock = fakeClock(FIXED_TIME);
      });
    });

    function addCompletedTask(completedAt: string): void {
      tasks.push(
        buildTask({
          is_completed: true,
          completed_at: completedAt,
        }),
      );
    }

    function groupTasks(): void {
      grouped = groupCompletedTasks(tasks, clock);
    }

    function expectSingleTaskInGroup(
      groupName: keyof GroupedCompletedTasks,
    ): void {
      expect(grouped[groupName]).toHaveLength(1);
      expect((grouped[groupName] as Task[])[0].id).toBe(tasks[0].id);
    }

    function expectEmptyGroup(groupName: keyof GroupedCompletedTasks): void {
      expect(grouped[groupName]).toHaveLength(0);
    }

    // @miss-behavior-specs @FR1
    f.Scenario(
      "Task completed today appears in today group",
      ({ Given, When, Then }) => {
        Given(
          'a task completed at "2026-06-24T10:00:00Z"',
          (_ctx: TestContext) => {
            addCompletedTask("2026-06-24T10:00:00.000Z");
          },
        );

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the task appears in the today group", (_ctx: TestContext) => {
          expectSingleTaskInGroup("todayTasks");
        });
      },
    );

    // @miss-behavior-specs @FR1
    f.Scenario(
      "Task completed yesterday appears in yesterday group",
      ({ Given, When, Then }) => {
        Given(
          'a task completed at "2026-06-23T10:00:00Z"',
          (_ctx: TestContext) => {
            addCompletedTask("2026-06-23T10:00:00.000Z");
          },
        );

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the task appears in the yesterday group", (_ctx: TestContext) => {
          expectSingleTaskInGroup("yesterdayTasks");
        });
      },
    );

    // @miss-behavior-specs @FR1
    f.Scenario(
      "Task completed 3 days ago appears in week group",
      ({ Given, When, Then }) => {
        Given(
          'a task completed at "2026-06-21T10:00:00Z"',
          (_ctx: TestContext) => {
            addCompletedTask("2026-06-21T10:00:00.000Z");
          },
        );

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the task appears in the week group", (_ctx: TestContext) => {
          expectSingleTaskInGroup("weekTasks");
        });
      },
    );

    // @miss-behavior-specs @FR1
    f.Scenario(
      "Task completed 15 days ago appears in month group",
      ({ Given, When, Then }) => {
        Given(
          'a task completed at "2026-06-09T10:00:00Z"',
          (_ctx: TestContext) => {
            addCompletedTask("2026-06-09T10:00:00.000Z");
          },
        );

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the task appears in the month group", (_ctx: TestContext) => {
          expectSingleTaskInGroup("monthTasks");
        });
      },
    );

    // @miss-behavior-specs @FR1
    f.Scenario(
      "Task completed 60 days ago appears in earlier group",
      ({ Given, When, Then }) => {
        Given(
          'a task completed at "2026-04-25T10:00:00Z"',
          (_ctx: TestContext) => {
            addCompletedTask("2026-04-25T10:00:00.000Z");
          },
        );

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the task appears in the earlier group", (_ctx: TestContext) => {
          expectSingleTaskInGroup("earlierTasks");
        });
      },
    );

    // @miss-behavior-specs @FR1
    f.Scenario(
      "Empty sections are not present in output",
      ({ Given, When, Then, And }) => {
        Given(
          'a task completed at "2026-06-24T10:00:00Z"',
          (_ctx: TestContext) => {
            addCompletedTask("2026-06-24T10:00:00.000Z");
          },
        );

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the yesterday group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("yesterdayTasks");
        });

        And("the week group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("weekTasks");
        });

        And("the month group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("monthTasks");
        });

        And("the earlier group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("earlierTasks");
        });
      },
    );

    // @miss-behavior-specs @FR2
    f.Scenario(
      "No completed tasks results in all empty groups",
      ({ Given, When, Then, And }) => {
        Given("no completed tasks", (_ctx: TestContext) => {
          tasks = [];
        });

        When("tasks are grouped by completion date", (_ctx: TestContext) => {
          groupTasks();
        });

        Then("the today group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("todayTasks");
        });

        And("the yesterday group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("yesterdayTasks");
        });

        And("the week group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("weekTasks");
        });

        And("the month group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("monthTasks");
        });

        And("the earlier group is empty", (_ctx: TestContext) => {
          expectEmptyGroup("earlierTasks");
        });
      },
    );
  },
);
