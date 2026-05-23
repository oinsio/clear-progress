// implements FR3 of cascade-checklist-delete
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type MockInstance, type TestContext, vi } from "vitest";
import { db } from "@/db/database";
import {
  makeChecklistItem,
  makePushResponse,
} from "@/services/SyncService.test-helpers";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";

const feature = await loadFeature("../cascade_checklist_self_healing.feature");

type Context = Record<string, never>;
type MockFn = ReturnType<typeof vi.fn>;

function mockFn(target: unknown): MockFn {
  return target as MockFn;
}

function getPushedChecklistIds(pushMock: MockFn): string[] {
  const pushPayload = pushMock.mock.calls[0][0];
  return (pushPayload.checklist_items as Array<{ id: string }>).map(
    (item) => item.id,
  );
}

async function seedTaskWithChecklistItem(
  taskIdMap: Map<string, string>,
  checklistIdMap: Map<string, string>,
  repos: ReturnType<typeof createMockRepositories>,
  options: { taskNeedsSync: boolean } = { taskNeedsSync: true },
) {
  const t1Id = crypto.randomUUID();
  taskIdMap.set("T1", t1Id);
  const task = makeTask({ id: t1Id, needsSync: options.taskNeedsSync });
  await db.tasks.add(task);

  const c1Id = crypto.randomUUID();
  checklistIdMap.set("C1", c1Id);
  const checklistItem = makeChecklistItem({
    id: c1Id,
    task_id: t1Id,
    needsSync: true,
  });
  await db.checklist_items.add(checklistItem);

  if (options.taskNeedsSync) {
    mockFn(repos.taskRepository.getNeedingSync).mockResolvedValue([task]);
  }
  mockFn(repos.checklistRepository.getNeedingSync).mockResolvedValue([
    checklistItem,
  ]);
  mockFn(repos.taskRepository.getById).mockResolvedValue(task);
  mockFn(repos.checklistRepository.getById).mockResolvedValue(checklistItem);
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const checklistItemIds = new Map<string, string>();
  const taskIds = new Map<string, string>();
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;
  let consoleWarnSpy: MockInstance;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    checklistItemIds.clear();
    taskIds.clear();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  f.AfterEachScenario(() => {
    consoleWarnSpy.mockRestore();
  });

  // @cascade-checklist-delete @FR3
  f.Scenario(
    "Orphaned checklist item is removed before push",
    ({ Given, When, Then, And }) => {
      Given(
        'a checklist item "C1" referencing task "T99" that does not exist in IndexedDB',
        async (_ctx: TestContext) => {
          const c1Id = crypto.randomUUID();
          checklistItemIds.set("C1", c1Id);

          const orphanedItem = makeChecklistItem({
            id: c1Id,
            task_id: "T99",
            needsSync: true,
          });
          await db.checklist_items.add(orphanedItem);

          mockFn(
            repositories.checklistRepository.getNeedingSync,
          ).mockResolvedValue([orphanedItem]);
        },
      );

      When("push is triggered", async (_ctx: TestContext) => {
        mockFn(syncAdapter.push).mockResolvedValue(makePushResponse());
        await createSyncService(syncAdapter, repositories).push();
      });

      Then(
        'checklist item "C1" is hard-deleted from IndexedDB',
        async (_ctx: TestContext) => {
          const c1Id = getIdOrThrow(checklistItemIds, "C1");
          expect(await db.checklist_items.get(c1Id)).toBeUndefined();
        },
      );

      And(
        'checklist item "C1" is not included in push data',
        async (_ctx: TestContext) => {
          const pushMock = mockFn(syncAdapter.push);
          if (pushMock.mock.calls.length > 0) {
            const c1Id = getIdOrThrow(checklistItemIds, "C1");
            expect(getPushedChecklistIds(pushMock)).not.toContain(c1Id);
          }
        },
      );

      And(
        'a warning is logged about orphaned item "C1"',
        async (_ctx: TestContext) => {
          const c1Id = getIdOrThrow(checklistItemIds, "C1");
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining(c1Id),
          );
        },
      );
    },
  );

  // @cascade-checklist-delete @FR3
  f.Scenario(
    "Checklist item with existing task is not affected",
    ({ Given, When, Then }) => {
      Given(
        'a checklist item "C1" referencing task "T1" that exists in IndexedDB',
        async (_ctx: TestContext) => {
          await seedTaskWithChecklistItem(
            taskIds,
            checklistItemIds,
            repositories,
          );
        },
      );

      When("push is triggered", async (_ctx: TestContext) => {
        mockFn(syncAdapter.push).mockResolvedValue(makePushResponse());
        await createSyncService(syncAdapter, repositories).push();
      });

      Then(
        'checklist item "C1" is included in push data normally',
        async (_ctx: TestContext) => {
          const pushMock = mockFn(syncAdapter.push);
          expect(pushMock).toHaveBeenCalled();
          const c1Id = getIdOrThrow(checklistItemIds, "C1");
          expect(getPushedChecklistIds(pushMock)).toContain(c1Id);
        },
      );
    },
  );

  // @cascade-checklist-delete @FR3
  f.Scenario(
    "Self-healing with incremental push",
    ({ Given, When, Then, And }) => {
      Given(
        'a checklist item "C1" with needsSync true referencing task "T1"',
        async (_ctx: TestContext) => {
          const t1Id = crypto.randomUUID();
          taskIds.set("T1", t1Id);

          const c1Id = crypto.randomUUID();
          checklistItemIds.set("C1", c1Id);
          const checklistItem = makeChecklistItem({
            id: c1Id,
            task_id: t1Id,
            needsSync: true,
          });
          await db.checklist_items.add(checklistItem);

          mockFn(
            repositories.checklistRepository.getNeedingSync,
          ).mockResolvedValue([checklistItem]);
          mockFn(repositories.checklistRepository.getById).mockResolvedValue(
            checklistItem,
          );
        },
      );

      And(
        'task "T1" exists in IndexedDB but has needsSync false',
        async (_ctx: TestContext) => {
          const t1Id = getIdOrThrow(taskIds, "T1");
          const task = makeTask({ id: t1Id, needsSync: false });
          await db.tasks.add(task);
          // taskRepository.getNeedingSync returns [] (default mock) — task not in dirty set
        },
      );

      When("incremental push is triggered", async (_ctx: TestContext) => {
        mockFn(syncAdapter.push).mockResolvedValue(makePushResponse());
        await createSyncService(syncAdapter, repositories).push();
      });

      Then(
        'checklist item "C1" is included in push data normally',
        async (_ctx: TestContext) => {
          const pushMock = mockFn(syncAdapter.push);
          expect(pushMock).toHaveBeenCalled();
          const c1Id = getIdOrThrow(checklistItemIds, "C1");
          expect(getPushedChecklistIds(pushMock)).toContain(c1Id);
        },
      );
    },
  );

  // @cascade-checklist-delete @FR3
  f.Scenario("Self-healing with no orphans", ({ Given, When, Then }) => {
    Given(
      "all checklist items reference existing tasks",
      async (_ctx: TestContext) => {
        await seedTaskWithChecklistItem(
          taskIds,
          checklistItemIds,
          repositories,
        );
      },
    );

    When("push is triggered", async (_ctx: TestContext) => {
      mockFn(syncAdapter.push).mockResolvedValue(makePushResponse());
      await createSyncService(syncAdapter, repositories).push();
    });

    Then(
      "no items are removed and no warnings are logged",
      async (_ctx: TestContext) => {
        const c1Id = getIdOrThrow(checklistItemIds, "C1");
        expect(await db.checklist_items.get(c1Id)).toBeDefined();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      },
    );
  });
});
