// implements FR3, FR6 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { RecurringTaskDeduplicator } from "@/services/RecurringTaskDeduplicator";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../dedup_merge.feature");

type Context = Record<string, never>;

const DEDUPLICATION_RUN_TIMESTAMP = "2026-07-11T00:00:00.000Z";
const ORIGINAL_TASK_ID = "11111111-1111-4111-a111-111111111111";
const DEVICE_A_COPY_ID = "00000000-0000-4000-a000-000000000001";
const DEVICE_B_COPY_ID = "00000000-0000-4000-a000-000000000002";
const DEVICE_A_UPDATED_AT = "2026-07-08T10:00:00.000Z";
const DEVICE_B_UPDATED_AT = "2026-07-06T10:00:00.000Z";
const FIXED_REPEAT_RULE = "daily-1";
const AFTER_COMPLETION_REPEAT_RULE = "after_completion-3";

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let deduplicator: RecurringTaskDeduplicator;
  let deviceACopyBeforeMerge: Task;
  let deviceBCopyBeforeMerge: Task;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    const clock = fakeClock(DEDUPLICATION_RUN_TIMESTAMP);
    deduplicator = new RecurringTaskDeduplicator(
      new TaskRepository(),
      new ChecklistRepository(),
      clock,
    );
  });

  async function seedDeviceACopy(
    nextDate: string,
    description: string,
    repeatRule: string,
  ): Promise<void> {
    const deviceACopy = buildTask({
      id: DEVICE_A_COPY_ID,
      original_task_id: ORIGINAL_TASK_ID,
      next_date: nextDate,
      appear_date: nextDate,
      description,
      repeat_rule: repeatRule,
      updated_at: DEVICE_A_UPDATED_AT,
      is_completed: false,
      is_deleted: false,
      syncStatus: "synced" as const,
    });
    deviceACopyBeforeMerge = deviceACopy;
    await db.tasks.add(deviceACopy);
  }

  async function seedDeviceBCopy(
    nextDate: string,
    description: string,
    repeatRule: string,
  ): Promise<void> {
    const deviceBCopy = buildTask({
      id: DEVICE_B_COPY_ID,
      original_task_id: ORIGINAL_TASK_ID,
      next_date: nextDate,
      appear_date: nextDate,
      description,
      repeat_rule: repeatRule,
      updated_at: DEVICE_B_UPDATED_AT,
      is_completed: false,
      is_deleted: false,
      syncStatus: "synced" as const,
    });
    deviceBCopyBeforeMerge = deviceBCopy;
    await db.tasks.add(deviceBCopy);
  }

  type FixedScheduleScenarioSteps = {
    Given: (title: string, fn: (ctx: TestContext) => Promise<void>) => void;
    And: (title: string, fn: (ctx: TestContext) => Promise<void>) => void;
    When: (title: string, fn: (ctx: TestContext) => Promise<void>) => void;
  };

  function registerFixedScheduleSetupSteps({
    Given,
    And,
    When,
  }: FixedScheduleScenarioSteps): void {
    Given(
      'device A completed and edited the occurrence, producing a copy with next_date "2026-07-10" and description "v2" as the freshest update',
      async (_ctx: TestContext) => {
        await seedDeviceACopy("2026-07-10", "v2", FIXED_REPEAT_RULE);
      },
    );

    And(
      'device B completed the same occurrence offline, producing a copy with next_date "2026-07-09" and description "v1" as a staler update',
      async (_ctx: TestContext) => {
        await seedDeviceBCopy("2026-07-09", "v1", FIXED_REPEAT_RULE);
      },
    );

    When(
      "deduplication runs after device B pulls both copies",
      async (_ctx: TestContext) => {
        await deduplicator.deduplicate([ORIGINAL_TASK_ID]);
      },
    );
  }

  // @fix-stale-sync-overwrites @FR3
  f.Scenario(
    "Fixed schedule — earlier device's schedule wins with the later device's fresh content",
    ({ Given, When, Then, And }) => {
      registerFixedScheduleSetupSteps({ Given, And, When });

      Then(
        'the surviving copy has next_date "2026-07-09"',
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_B_COPY_ID)) as Task;
          expect(survivor.next_date).toBe("2026-07-09");
        },
      );

      And(
        'the surviving copy has description "v2"',
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_B_COPY_ID)) as Task;
          expect(survivor.description).toBe("v2");
        },
      );

      And(
        "the surviving copy's updated_at equals device A's update time",
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_B_COPY_ID)) as Task;
          expect(survivor.updated_at).toBe(DEVICE_A_UPDATED_AT);
        },
      );

      And(
        'device A\'s copy is soft-deleted with syncStatus "pending"',
        async (_ctx: TestContext) => {
          const loser = (await db.tasks.get(DEVICE_A_COPY_ID)) as Task;
          expect(loser.is_deleted).toBe(true);
          expect(loser.syncStatus).toBe("pending");
        },
      );
    },
  );

  // @fix-stale-sync-overwrites @FR6
  f.Scenario(
    "After-completion schedule — the same merge rules apply regardless of the recurrence model",
    ({ Given, When, Then, And }) => {
      Given(
        'device A completed the occurrence under an after_completion repeat_rule, producing a copy with next_date "2026-07-04" as the freshest update',
        async (_ctx: TestContext) => {
          await seedDeviceACopy("2026-07-04", "", AFTER_COMPLETION_REPEAT_RULE);
        },
      );

      And(
        'device B completed the same occurrence offline, producing a copy with next_date "2026-07-05" as a staler update',
        async (_ctx: TestContext) => {
          await seedDeviceBCopy("2026-07-05", "", AFTER_COMPLETION_REPEAT_RULE);
        },
      );

      When(
        "deduplication runs after device B pulls both copies",
        async (_ctx: TestContext) => {
          await deduplicator.deduplicate([ORIGINAL_TASK_ID]);
        },
      );

      Then(
        'the surviving copy has next_date "2026-07-04"',
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_A_COPY_ID)) as Task;
          expect(survivor.next_date).toBe("2026-07-04");
        },
      );

      And(
        "the surviving copy's repeat_rule is unchanged from before the merge",
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_A_COPY_ID)) as Task;
          expect(survivor.repeat_rule).toBe(AFTER_COMPLETION_REPEAT_RULE);
        },
      );

      And(
        "the surviving copy's appear_date is consistent with its own next_date",
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_A_COPY_ID)) as Task;
          expect(survivor.appear_date).toBe(survivor.next_date);
        },
      );
    },
  );

  // @fix-stale-sync-overwrites @FR3
  f.Scenario(
    "Merge is not a verbatim keep-earliest — schedule and content are combined from different copies",
    ({ Given, When, Then, And }) => {
      registerFixedScheduleSetupSteps({ Given, And, When });

      Then(
        "the surviving copy does not equal device B's copy verbatim",
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_B_COPY_ID)) as Task;
          expect(survivor).not.toEqual(deviceBCopyBeforeMerge);
        },
      );

      And(
        "the surviving copy does not equal device A's copy verbatim",
        async (_ctx: TestContext) => {
          const survivor = (await db.tasks.get(DEVICE_B_COPY_ID)) as Task;
          expect(survivor).not.toEqual(deviceACopyBeforeMerge);
        },
      );
    },
  );
});
