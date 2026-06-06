// implements FR6 of add-file-attachments — attachment ordering in chunked push
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, type vi } from "vitest";
import { makeAttachment } from "@/services/SyncService.test-helpers";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makeGoal,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import type { SyncProtocolTestContext } from "@/test/helpers/bdd/syncProtocol/types";
import type { Attachment } from "@/types/entities";

const feature = await loadFeature("../sync_chunked_push.feature");

type Context = SyncProtocolTestContext & {
  repositories: ReturnType<typeof createMockRepositories>;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<Context>) => {
    let repositories: ReturnType<typeof createMockRepositories>;
    let syncAdapter: SyncAdapter;

    f.BeforeEachScenario(async () => {
      repositories = createMockRepositories();
      syncAdapter = createMockSyncAdapter();
      localStorage.clear();
    });

    // @add-file-attachments @FR6
    f.Scenario(
      "Attachments are placed after parent entities in chunk fill order",
      ({ Given, When, Then, And }) => {
        const dirtyTasks = Array.from({ length: 190 }, (_, i) =>
          makeTask({ id: `t${i}`, needsSync: true }),
        );
        const dirtyAttachments = Array.from({ length: 20 }, (_, i) =>
          makeAttachment({
            id: `a${i}`,
            entity_type: "task",
            entity_id: `t${i % 190}`,
            needsSync: true,
          }),
        );

        Given(
          "client has 190 dirty tasks and 20 dirty attachments referencing those tasks",
          async (_ctx: TestContext) => {
            (
              repositories.taskRepository.getNeedingSync as ReturnType<
                typeof vi.fn
              >
            ).mockResolvedValue(dirtyTasks);
            (
              repositories.taskRepository.getById as ReturnType<typeof vi.fn>
            ).mockImplementation(async (id: string) =>
              dirtyTasks.find((task) => task.id === id),
            );
            (
              repositories.attachmentRepository.getNeedingSync as ReturnType<
                typeof vi.fn
              >
            ).mockResolvedValue(dirtyAttachments);
            (
              repositories.attachmentRepository.getById as ReturnType<
                typeof vi.fn
              >
            ).mockImplementation(async (id: string) =>
              dirtyAttachments.find((attachment) => attachment.id === id),
            );
          },
        );

        When("push is called", async (_ctx: TestContext) => {
          const service = createSyncService(syncAdapter, repositories);
          await service.push();
        });

        Then(
          "chunk 1 contains 190 tasks and 10 attachments",
          async (_ctx: TestContext) => {
            const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>)
              .mock.calls;
            expect(pushCalls[0][0].tasks).toHaveLength(190);
            expect(pushCalls[0][0].attachments).toHaveLength(10);
          },
        );

        And(
          "chunk 2 contains the remaining 10 attachments",
          async (_ctx: TestContext) => {
            const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>)
              .mock.calls;
            expect(pushCalls).toHaveLength(2);
            expect(pushCalls[1][0].attachments).toHaveLength(10);
            expect(pushCalls[1][0].tasks).toHaveLength(0);
          },
        );
      },
    );

    // @add-file-attachments @FR6
    f.Scenario(
      "New entity and its attachment land in correct order",
      ({ Given, When, Then, And }) => {
        const dirtyGoals = Array.from({ length: 195 }, (_, i) =>
          makeGoal({ id: `g${i}`, needsSync: true }),
        );
        const dirtyAttachments = Array.from({ length: 10 }, (_, i) =>
          makeAttachment({
            id: `a${i}`,
            entity_type: "goal",
            entity_id: `g${i % 195}`,
            needsSync: true,
          }),
        );

        Given(
          "client has 195 dirty goals and 10 dirty attachments referencing those goals",
          async (_ctx: TestContext) => {
            (
              repositories.goalRepository.getNeedingSync as ReturnType<
                typeof vi.fn
              >
            ).mockResolvedValue(dirtyGoals);
            (
              repositories.goalRepository.getById as ReturnType<typeof vi.fn>
            ).mockImplementation(async (id: string) =>
              dirtyGoals.find((goal) => goal.id === id),
            );
            (
              repositories.attachmentRepository.getNeedingSync as ReturnType<
                typeof vi.fn
              >
            ).mockResolvedValue(dirtyAttachments);
            (
              repositories.attachmentRepository.getById as ReturnType<
                typeof vi.fn
              >
            ).mockImplementation(async (id: string) =>
              dirtyAttachments.find((attachment) => attachment.id === id),
            );
          },
        );

        When("push is called", async (_ctx: TestContext) => {
          const service = createSyncService(syncAdapter, repositories);
          await service.push();
        });

        Then(
          "chunk 1 contains 195 goals and 5 attachments",
          async (_ctx: TestContext) => {
            const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>)
              .mock.calls;
            expect(pushCalls[0][0].goals).toHaveLength(195);
            expect(pushCalls[0][0].attachments).toHaveLength(5);
          },
        );

        And(
          "chunk 2 contains the remaining 5 attachments",
          async (_ctx: TestContext) => {
            const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>)
              .mock.calls;
            expect(pushCalls).toHaveLength(2);
            expect(pushCalls[1][0].attachments).toHaveLength(5);
            expect(pushCalls[1][0].goals).toHaveLength(0);
          },
        );

        And(
          "no attachment appears in a chunk before its parent entity",
          async (_ctx: TestContext) => {
            const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>)
              .mock.calls;
            const seenEntityIds = new Set<string>();

            for (const call of pushCalls) {
              const chunk = call[0];
              const goalIds = (chunk.goals as Array<{ id: string }>).map(
                (goal) => goal.id,
              );
              const taskIds = (chunk.tasks as Array<{ id: string }>).map(
                (task) => task.id,
              );

              for (const entityId of [...goalIds, ...taskIds]) {
                seenEntityIds.add(entityId);
              }

              for (const attachment of chunk.attachments as Attachment[]) {
                expect(seenEntityIds.has(attachment.entity_id)).toBe(true);
              }
            }
          },
        );
      },
    );
  },
  { includeTags: ["add-file-attachments"] },
);
