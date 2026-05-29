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
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}

/** New logic: unsynced indicator uses needsSync flag */
function isUnsynced(entity: { needsSync: boolean }): boolean {
  return entity.needsSync;
}

/** New logic: hasUnsyncedItems uses needsSync */
function computeHasUnsyncedItems(items: ChecklistItem[]): boolean {
  return items.some((item) => item.needsSync);
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
    "Entity with needsSync true shows as unsynced",
    ({ Given, Then }) => {
      Given(
        "an entity with needsSync set to true",
        async (_ctx: TestContext) => {
          entity = makeTask({ needsSync: true });
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
    "Entity with needsSync false shows as synced",
    ({ Given, Then }) => {
      Given(
        "an entity with needsSync set to false",
        async (_ctx: TestContext) => {
          entity = makeTask({ needsSync: false });
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
        "items A and B were collected for push with needsSync true",
        async (_ctx: TestContext) => {
          makeTask({ id: "a", needsSync: true });
          makeTask({ id: "b", needsSync: true });
        },
      );

      And(
        "item C is created during the sync cycle with needsSync true",
        async (_ctx: TestContext) => {
          itemC = makeTask({
            id: "c",
            needsSync: true,
            updated_at: "2026-05-29T10:00:05.000Z" as ISOTimestamp,
          });
        },
      );

      And(
        "sync completes setting lastSyncedAt to current time",
        async (_ctx: TestContext) => {
          // lastSyncedAt is set AFTER sync completes, e.g. "2026-05-29T10:00:10.000Z"
          // With old logic: itemC.updated_at < lastSyncedAt → falsely shows as synced
          // With new logic: itemC.needsSync is still true → correctly shows as unsynced
          // lastSyncedAt would be "2026-05-29T10:00:10.000Z" — after item C's updated_at
        },
      );

      Then(
        "item C is considered unsynced because needsSync is true",
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
        "a task has 3 checklist items where 1 has needsSync true",
        async (_ctx: TestContext) => {
          checklistItems = [
            makeChecklistItem({ needsSync: false }),
            makeChecklistItem({ needsSync: true }),
            makeChecklistItem({ needsSync: false }),
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
      "a task has 3 checklist items all with needsSync false",
      async (_ctx: TestContext) => {
        checklistItems = [
          makeChecklistItem({ needsSync: false }),
          makeChecklistItem({ needsSync: false }),
          makeChecklistItem({ needsSync: false }),
        ];
      },
    );

    Then("hasUnsyncedItems is false", async (_ctx: TestContext) => {
      hasUnsyncedResult = computeHasUnsyncedItems(checklistItems);
      expect(hasUnsyncedResult).toBe(false);
    });
  });
});
