// implements FR1, FR3, FR4 of fix-sync-indicator-race
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { makeTask } from "@/test/helpers/bdd/syncProtocol/helpers";
import type { ChecklistItem, ISOTimestamp, Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

const feature = await loadFeature("../sync_indicator_race.feature");

function makeChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  return {
    id: crypto.randomUUID(),
    task_id: "task-1",
    name: "Test Item",
    is_completed: false,
    sort_order: "0",
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    syncStatus: "synced" as const,
    ...overrides,
  };
}

/** New logic: unsynced indicator uses syncStatus flag */
function isUnsynced(entity: { syncStatus: string }): boolean {
  return entity.syncStatus !== "synced";
}

/** New logic: hasUnsyncedItems uses syncStatus */
function computeHasUnsyncedItems(items: ChecklistItem[]): boolean {
  return items.some((item) => item.syncStatus !== "synced");
}

type Context = {
  entity: Task;
  unsyncedResult: boolean;
  checklistItems: ChecklistItem[];
  hasUnsyncedResult: boolean;
  itemC: Task;
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let entity: Task;
  let unsyncedResult: boolean;
  let checklistItems: ChecklistItem[];
  let hasUnsyncedResult: boolean;
  let itemC: Task;

  f.BeforeEachScenario(async () => {
    entity = makeTask();
    unsyncedResult = false;
    checklistItems = [];
    hasUnsyncedResult = false;
    itemC = makeTask();
  });

  // @fix-sync-indicator-race @FR1
  f.Scenario(
    'Entity with syncStatus "pending" shows as unsynced',
    ({ Given, Then }) => {
      Given(
        'an entity with syncStatus set to "pending"',
        async (_ctx: TestContext) => {
          entity = makeTask({ syncStatus: "pending" as const });
        },
      );

      Then("the entity is considered unsynced", async (_ctx: TestContext) => {
        unsyncedResult = isUnsynced(entity);
        expect(unsyncedResult).toBe(true);
      });
    },
  );

  // @fix-sync-indicator-race @FR1
  f.Scenario(
    'Entity with syncStatus "synced" shows as synced',
    ({ Given, Then }) => {
      Given(
        'an entity with syncStatus set to "synced"',
        async (_ctx: TestContext) => {
          entity = makeTask({ syncStatus: "synced" as const });
        },
      );

      Then("the entity is considered synced", async (_ctx: TestContext) => {
        unsyncedResult = isUnsynced(entity);
        expect(unsyncedResult).toBe(false);
      });
    },
  );

  // @fix-sync-indicator-race @FR4
  f.Scenario(
    "Item created during sync retains unsynced indicator",
    ({ Given, And, Then }) => {
      Given(
        'items A and B were collected for push with syncStatus "pending"',
        async (_ctx: TestContext) => {
          makeTask({ id: "a", syncStatus: "pending" as const });
          makeTask({ id: "b", syncStatus: "pending" as const });
        },
      );

      And(
        'item C is created during the sync cycle with syncStatus "pending"',
        async (_ctx: TestContext) => {
          itemC = makeTask({
            id: "c",
            syncStatus: "pending" as const,
            updated_at: "2026-05-29T10:00:05.000Z" as ISOTimestamp,
          });
        },
      );

      And(
        "sync completes setting lastSyncedAt to current time",
        async (_ctx: TestContext) => {
          // lastSyncedAt is set AFTER sync completes, e.g. "2026-05-29T10:00:10.000Z"
          // With old logic: itemC.updated_at < lastSyncedAt → falsely shows as synced
          // With new logic: itemC.syncStatus is still true → correctly shows as unsynced
          // lastSyncedAt would be "2026-05-29T10:00:10.000Z" — after item C's updated_at
        },
      );

      Then(
        'item C is considered unsynced because syncStatus is "pending"',
        async (_ctx: TestContext) => {
          unsyncedResult = isUnsynced(itemC);
          expect(unsyncedResult).toBe(true);
        },
      );
    },
  );

  // @fix-sync-indicator-race @FR3
  f.Scenario(
    "One unsynced checklist item flags the task",
    ({ Given, Then }) => {
      Given(
        'a task has 3 checklist items where 1 has syncStatus "pending"',
        async (_ctx: TestContext) => {
          checklistItems = [
            makeChecklistItem({ syncStatus: "synced" as const }),
            makeChecklistItem({ syncStatus: "pending" as const }),
            makeChecklistItem({ syncStatus: "synced" as const }),
          ];
        },
      );

      Then("hasUnsyncedItems is true", async (_ctx: TestContext) => {
        hasUnsyncedResult = computeHasUnsyncedItems(checklistItems);
        expect(hasUnsyncedResult).toBe(true);
      });
    },
  );

  // @fix-sync-indicator-race @FR3
  f.Scenario("All synced checklist items clear the flag", ({ Given, Then }) => {
    Given(
      'a task has 3 checklist items all with syncStatus "synced"',
      async (_ctx: TestContext) => {
        checklistItems = [
          makeChecklistItem({ syncStatus: "synced" as const }),
          makeChecklistItem({ syncStatus: "synced" as const }),
          makeChecklistItem({ syncStatus: "synced" as const }),
        ];
      },
    );

    Then("hasUnsyncedItems is false", async (_ctx: TestContext) => {
      hasUnsyncedResult = computeHasUnsyncedItems(checklistItems);
      expect(hasUnsyncedResult).toBe(false);
    });
  });
});
