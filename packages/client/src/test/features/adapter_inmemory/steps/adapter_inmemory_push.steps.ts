// implements FR2, FR4, FR5 of adapter-inmemory-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { InMemorySyncAdapter } from "@clear-progress/adapter-inmemory";
import type {
  Box,
  PushItemResult,
  PushResponse,
  WireTask,
} from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { createWireTask } from "./wire-factories";

const feature = await loadFeature("../adapter_inmemory_push.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: InMemorySyncAdapter;
    let pushResponse: PushResponse;
    let secondPushResponse: PushResponse;
    let taskResult: PushItemResult;
    let existingTask: WireTask;

    function firstTaskResult(response: PushResponse): PushItemResult {
      return response.results.tasks?.[0] as PushItemResult;
    }

    f.BeforeEachScenario(async () => {
      adapter = new InMemorySyncAdapter();
    });

    // @adapter-inmemory-spec @FR2
    f.Scenario("New entity gets created status", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When("a task with a valid UUID is pushed", async (_ctx: TestContext) => {
        const task = createWireTask();
        pushResponse = await adapter.push({ tasks: [task] });
      });

      Then(
        'the push result has status "created" and revision greater than 0',
        async (_ctx: TestContext) => {
          expect(pushResponse.results.tasks?.[0]?.status).toBe("created");
          expect(pushResponse.revision).toBeGreaterThan(0);
        },
      );
    });

    // @adapter-inmemory-spec @FR2
    f.Scenario(
      "Revision increments per push batch",
      ({ Given, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        When(
          "two separate push calls are made with different tasks",
          async (_ctx: TestContext) => {
            pushResponse = await adapter.push({
              tasks: [createWireTask({ name: "Task 1" })],
            });
            secondPushResponse = await adapter.push({
              tasks: [createWireTask({ name: "Task 2" })],
            });
          },
        );

        Then(
          "the second push has a higher revision than the first",
          async (_ctx: TestContext) => {
            expect(secondPushResponse.revision).toBeGreaterThan(
              pushResponse.revision ?? 0,
            );
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR2
    f.Scenario(
      "Update with newer timestamp is accepted",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a task exists with updated_at "2026-01-01T10:00:00.000Z"',
          async (_ctx: TestContext) => {
            existingTask = createWireTask({
              updated_at: "2026-01-01T10:00:00.000Z",
            });
            await adapter.push({ tasks: [existingTask] });
          },
        );

        When(
          'the task is updated with updated_at "2026-01-01T12:00:00.000Z"',
          async (_ctx: TestContext) => {
            pushResponse = await adapter.push({
              tasks: [
                { ...existingTask, updated_at: "2026-01-01T12:00:00.000Z" },
              ],
            });
            taskResult = firstTaskResult(pushResponse);
          },
        );

        Then(
          'the push result has status "accepted"',
          async (_ctx: TestContext) => {
            expect(taskResult.status).toBe("accepted");
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR2
    f.Scenario(
      "Update with equal timestamp is accepted",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a task exists with updated_at "2026-01-01T10:00:00.000Z"',
          async (_ctx: TestContext) => {
            existingTask = createWireTask({
              updated_at: "2026-01-01T10:00:00.000Z",
            });
            await adapter.push({ tasks: [existingTask] });
          },
        );

        When(
          'the task is updated with updated_at "2026-01-01T10:00:00.000Z"',
          async (_ctx: TestContext) => {
            pushResponse = await adapter.push({
              tasks: [
                {
                  ...existingTask,
                  name: "Updated",
                  updated_at: "2026-01-01T10:00:00.000Z",
                },
              ],
            });
            taskResult = firstTaskResult(pushResponse);
          },
        );

        Then(
          'the push result has status "accepted"',
          async (_ctx: TestContext) => {
            expect(taskResult.status).toBe("accepted");
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR4
    f.Scenario("Invalid UUID is rejected", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When(
        'a task with id "not-a-uuid" is pushed',
        async (_ctx: TestContext) => {
          const task = createWireTask({ id: "not-a-uuid" });
          pushResponse = await adapter.push({ tasks: [task] });
          taskResult = firstTaskResult(pushResponse);
        },
      );

      Then(
        'the push result has status "rejected" with reason "Invalid UUID format"',
        async (_ctx: TestContext) => {
          expect(taskResult.status).toBe("rejected");
          expect(taskResult.reason).toBe("Invalid UUID format");
        },
      );
    });

    // @adapter-inmemory-spec @FR4
    f.Scenario("Blank name is rejected", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When("a task with blank name is pushed", async (_ctx: TestContext) => {
        const task = createWireTask({ name: "" });
        pushResponse = await adapter.push({ tasks: [task] });
        taskResult = firstTaskResult(pushResponse);
      });

      Then(
        'the push result has status "rejected" with reason "Name must not be blank"',
        async (_ctx: TestContext) => {
          expect(taskResult.status).toBe("rejected");
          expect(taskResult.reason).toBe("Name must not be blank");
        },
      );
    });

    // @adapter-inmemory-spec @FR4
    f.Scenario("Invalid box is rejected", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When('a task with box "invalid" is pushed', async (_ctx: TestContext) => {
        const task = createWireTask({
          box: "invalid" as unknown as Box,
        });
        pushResponse = await adapter.push({ tasks: [task] });
        taskResult = firstTaskResult(pushResponse);
      });

      Then(
        'the push result has status "rejected" with reason containing "invalid"',
        async (_ctx: TestContext) => {
          expect(taskResult.status).toBe("rejected");
          expect(taskResult.reason).toContain("invalid");
        },
      );
    });

    // @adapter-inmemory-spec @FR5
    f.Scenario(
      "Stale update returns conflict with server record",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a task exists with updated_at "2026-01-02T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            existingTask = createWireTask({
              updated_at: "2026-01-02T00:00:00.000Z",
            });
            await adapter.push({ tasks: [existingTask] });
          },
        );

        When(
          'the task is updated with updated_at "2026-01-01T12:00:00.000Z"',
          async (_ctx: TestContext) => {
            pushResponse = await adapter.push({
              tasks: [
                {
                  ...existingTask,
                  name: "Stale update",
                  updated_at: "2026-01-01T12:00:00.000Z",
                },
              ],
            });
            taskResult = firstTaskResult(pushResponse);
          },
        );

        Then(
          'the push result has status "conflict" with server_record',
          async (_ctx: TestContext) => {
            expect(taskResult.status).toBe("conflict");
            expect(taskResult.server_record).toBeDefined();
          },
        );
      },
    );
  },
);
