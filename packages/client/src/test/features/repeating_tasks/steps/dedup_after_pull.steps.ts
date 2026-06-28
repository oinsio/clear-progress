// implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { RecurringTaskDeduplicator } from "@/services/RecurringTaskDeduplicator";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";

const feature = await loadFeature("../dedup_after_pull.feature");

type Context = Record<string, never>;

const FIXED_CLOCK_TIMESTAMP = "2026-07-10T12:00:00Z";
const COPY_A_ID = "00000000-0000-4000-a000-000000000001";
const COPY_B_ID = "00000000-0000-4000-a000-000000000002";
const COPY_B_LARGE_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";
const ORIGINAL_TASK_ID = "11111111-1111-4111-a111-111111111111";

async function seedTwoCopies(copyAId: string, copyBId: string): Promise<void> {
  const taskA = buildTask({
    id: copyAId,
    original_task_id: ORIGINAL_TASK_ID,
    is_completed: false,
    is_deleted: false,
  });
  const taskB = buildTask({
    id: copyBId,
    original_task_id: ORIGINAL_TASK_ID,
    is_completed: false,
    is_deleted: false,
  });
  await db.tasks.bulkAdd([taskA, taskB]);
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let deduplicator: RecurringTaskDeduplicator;
  let checklistItemId: string;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    checklistItemId = "";
    const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
    deduplicator = new RecurringTaskDeduplicator(
      new TaskRepository(),
      new ChecklistRepository(),
      clock,
    );
  });

  // @dedup-recurring-after-pull @FR1 @FR2
  f.Scenario(
    "Two duplicates with different next_date — earlier wins",
    ({ Given, When, Then, And }) => {
      Given(
        "two recurring copies with the same original_task_id",
        async (_ctx: TestContext) => {
          await seedTwoCopies(COPY_A_ID, COPY_B_ID);
        },
      );

      And('copy A has next_date "2026-07-01"', async (_ctx: TestContext) => {
        await db.tasks.update(COPY_A_ID, { next_date: "2026-07-01" });
      });

      And('copy B has next_date "2026-07-05"', async (_ctx: TestContext) => {
        await db.tasks.update(COPY_B_ID, { next_date: "2026-07-05" });
      });

      When("deduplication runs", async (_ctx: TestContext) => {
        await deduplicator.deduplicate([ORIGINAL_TASK_ID]);
      });

      Then("copy A is kept", async (_ctx: TestContext) => {
        const task = await db.tasks.get(COPY_A_ID);
        expect(task?.is_deleted).toBe(false);
      });

      And(
        'copy B is soft-deleted with syncStatus "pending"',
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(COPY_B_ID);
          expect(task?.is_deleted).toBe(true);
          expect(task?.syncStatus).toBe("pending");
        },
      );
    },
  );

  // @dedup-recurring-after-pull @FR1 @FR2
  f.Scenario(
    "Two duplicates with same next_date — tiebreak by id",
    ({ Given, When, Then, And }) => {
      Given(
        "two recurring copies with the same original_task_id",
        async (_ctx: TestContext) => {
          await seedTwoCopies(COPY_A_ID, COPY_B_LARGE_ID);
        },
      );

      And(
        'copy A has next_date "2026-07-01" and lexicographically smaller id',
        async (_ctx: TestContext) => {
          await db.tasks.update(COPY_A_ID, { next_date: "2026-07-01" });
        },
      );

      And(
        'copy B has next_date "2026-07-01" and lexicographically larger id',
        async (_ctx: TestContext) => {
          await db.tasks.update(COPY_B_LARGE_ID, { next_date: "2026-07-01" });
        },
      );

      When("deduplication runs", async (_ctx: TestContext) => {
        await deduplicator.deduplicate([ORIGINAL_TASK_ID]);
      });

      Then("copy A is kept", async (_ctx: TestContext) => {
        const task = await db.tasks.get(COPY_A_ID);
        expect(task?.is_deleted).toBe(false);
      });

      And(
        'copy B is soft-deleted with syncStatus "pending"',
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(COPY_B_LARGE_ID);
          expect(task?.is_deleted).toBe(true);
          expect(task?.syncStatus).toBe("pending");
        },
      );
    },
  );

  // @dedup-recurring-after-pull @FR1
  f.Scenario(
    "No duplicates — single copy is untouched",
    ({ Given, When, Then }) => {
      Given("one recurring copy exists", async (_ctx: TestContext) => {
        const task = buildTask({
          id: COPY_A_ID,
          original_task_id: ORIGINAL_TASK_ID,
          next_date: "2026-07-01",
          is_completed: false,
          is_deleted: false,
        });
        await db.tasks.add(task);
      });

      When("deduplication runs", async (_ctx: TestContext) => {
        await deduplicator.deduplicate([ORIGINAL_TASK_ID]);
      });

      Then("the single copy is kept", async (_ctx: TestContext) => {
        const task = await db.tasks.get(COPY_A_ID);
        expect(task?.is_deleted).toBe(false);
      });
    },
  );

  // @dedup-recurring-after-pull @FR3
  f.Scenario(
    "Checklist items of loser are cascade soft-deleted",
    ({ Given, When, Then, And }) => {
      Given(
        "two recurring copies with the same original_task_id",
        async (_ctx: TestContext) => {
          await seedTwoCopies(COPY_A_ID, COPY_B_ID);
        },
      );

      And('copy A has next_date "2026-07-01"', async (_ctx: TestContext) => {
        await db.tasks.update(COPY_A_ID, { next_date: "2026-07-01" });
      });

      And('copy B has next_date "2026-07-05"', async (_ctx: TestContext) => {
        await db.tasks.update(COPY_B_ID, { next_date: "2026-07-05" });
      });

      And("copy B has a checklist item", async (_ctx: TestContext) => {
        const item = buildChecklistItem({
          task_id: COPY_B_ID,
          is_deleted: false,
        });
        checklistItemId = item.id;
        await db.checklist_items.add(item);
      });

      When("deduplication runs", async (_ctx: TestContext) => {
        await deduplicator.deduplicate([ORIGINAL_TASK_ID]);
      });

      Then(
        'the checklist item is soft-deleted with syncStatus "pending"',
        async (_ctx: TestContext) => {
          const item = await db.checklist_items.get(checklistItemId);
          expect(item?.is_deleted).toBe(true);
          expect(item?.syncStatus).toBe("pending");
        },
      );
    },
  );

  // @dedup-recurring-after-pull @FR5
  f.Scenario(
    "Empty original_task_id list — deduplication is skipped",
    ({ Given, When, Then }) => {
      Given(
        "two recurring copies with the same original_task_id",
        async (_ctx: TestContext) => {
          await seedTwoCopies(COPY_A_ID, COPY_B_ID);
          await db.tasks.update(COPY_A_ID, { next_date: "2026-07-01" });
          await db.tasks.update(COPY_B_ID, { next_date: "2026-07-05" });
        },
      );

      When("deduplication runs with empty list", async (_ctx: TestContext) => {
        await deduplicator.deduplicate([]);
      });

      Then("no tasks are modified", async (_ctx: TestContext) => {
        const taskA = await db.tasks.get(COPY_A_ID);
        const taskB = await db.tasks.get(COPY_B_ID);
        expect(taskA?.is_deleted).toBe(false);
        expect(taskB?.is_deleted).toBe(false);
      });
    },
  );
});
