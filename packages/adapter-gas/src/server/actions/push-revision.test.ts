import { describe, expect, it, vi } from "vitest";
import { upsertCategories } from "../sheets/categories.sheet";
import { upsertChecklistItems } from "../sheets/checklists.sheet";
import { upsertContexts } from "../sheets/contexts.sheet";
import { upsertGoals } from "../sheets/goals.sheet";
import { readNextRevision, saveNextRevision } from "../sheets/meta.sheet";
import { getAllTasks, upsertTasks } from "../sheets/tasks.sheet";
import { push } from "./push";
import {
  getResults,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeTask,
  parseResponse,
  pushConflictTaskScenario,
  setupPushTests,
} from "./push-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

describe("push", () => {
  setupPushTests();

  describe("readNextRevision gating", () => {
    it.each([
      { entityName: "tasks", makePush: () => push({ tasks: [makeTask()] }) },
      { entityName: "goals", makePush: () => push({ goals: [makeGoal()] }) },
      {
        entityName: "contexts",
        makePush: () => push({ contexts: [makeContext()] }),
      },
      {
        entityName: "categories",
        makePush: () => push({ categories: [makeCategory()] }),
      },
      {
        entityName: "checklist_items",
        makePush: () => push({ checklist_items: [makeChecklistItem()] }),
      },
    ])("should call readNextRevision when $entityName are pushed", ({
      makePush,
    }) => {
      makePush();
      expect(readNextRevision).toHaveBeenCalled();
    });

    it("should NOT call readNextRevision when only settings are pushed", () => {
      push({
        settings: [
          {
            key: "default_box",
            value: "today",
            updated_at: "2025-01-01T00:00:00.000Z",
          },
        ],
      });
      expect(readNextRevision).not.toHaveBeenCalled();
    });

    it("should NOT call readNextRevision when push is empty", () => {
      push({});
      expect(readNextRevision).not.toHaveBeenCalled();
    });
  });

  describe("conflict does not consume a revision", () => {
    it("should save next_revision incremented only by created/accepted count, not conflict", () => {
      vi.mocked(readNextRevision).mockReturnValue(1);

      const serverTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-02T00:00:00.000Z",
      });
      const conflictTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const newTask = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [conflictTask, newTask] });

      expect(saveNextRevision).toHaveBeenCalledWith(2);
    });

    it("should NOT call saveNextRevision when all records are conflicts", () => {
      const serverTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-02T00:00:00.000Z",
      });
      const conflictTask = makeTask({
        id: "11111111-1111-4111-a111-111111111111",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      vi.mocked(getAllTasks).mockReturnValue([serverTask]);

      push({ tasks: [conflictTask] });

      expect(saveNextRevision).not.toHaveBeenCalled();
    });
  });

  describe("saveNextRevision triggered by any entity type", () => {
    it.each([
      {
        entityName: "goals",
        currentRevision: 5,
        makePush: () =>
          push({
            goals: [makeGoal({ id: "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee" })],
          }),
        expectedRevision: 6,
      },
      {
        entityName: "contexts",
        currentRevision: 3,
        makePush: () =>
          push({
            contexts: [
              makeContext({ id: "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1" }),
            ],
          }),
        expectedRevision: 4,
      },
      {
        entityName: "categories",
        currentRevision: 2,
        makePush: () =>
          push({
            categories: [
              makeCategory({ id: "c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3" }),
            ],
          }),
        expectedRevision: 3,
      },
      {
        entityName: "checklist_items",
        currentRevision: 10,
        makePush: () =>
          push({
            checklist_items: [
              makeChecklistItem({ id: "e5e5e5e5-e5e5-4e5e-8e5e-e5e5e5e5e5e5" }),
            ],
          }),
        expectedRevision: 11,
      },
    ])("should call saveNextRevision when only $entityName have accepted records", ({
      currentRevision,
      makePush,
      expectedRevision,
    }) => {
      vi.mocked(readNextRevision).mockReturnValue(currentRevision);
      makePush();
      expect(saveNextRevision).toHaveBeenCalledWith(expectedRevision);
    });

    it("should NOT call saveNextRevision when tasks are all rejected", () => {
      const rejectedTask = makeTask({ id: "", name: "Valid" });

      push({ tasks: [rejectedTask] });

      expect(saveNextRevision).not.toHaveBeenCalled();
    });
  });

  describe("revision assignment", () => {
    it("should assign same revision to all accepted/created records in one push", () => {
      vi.mocked(readNextRevision).mockReturnValue(10);
      const task1 = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });
      const task2 = makeTask({ id: "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb" });

      push({ tasks: [task1, task2] });

      expect(upsertTasks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
            revision: 10,
          }),
          expect.objectContaining({
            id: "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
            revision: 10,
          }),
        ]),
      );
    });

    it("should save next_revision incremented by 1 regardless of record count", () => {
      vi.mocked(readNextRevision).mockReturnValue(1);
      const task1 = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });
      const task2 = makeTask({ id: "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb" });

      push({ tasks: [task1, task2] });

      expect(saveNextRevision).toHaveBeenCalledWith(2);
    });

    it("should return top-level revision in response when any record is accepted", () => {
      vi.mocked(readNextRevision).mockReturnValue(5);
      const newTask = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });

      push({ tasks: [newTask] });

      expect(parseResponse()).toHaveProperty("revision", 5);
    });

    it("should NOT include revision in individual task result items", () => {
      vi.mocked(readNextRevision).mockReturnValue(5);
      const newTask = makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" });

      push({ tasks: [newTask] });

      const results = getResults();
      expect(results.tasks![0]).not.toHaveProperty("revision");
    });

    it("should NOT return revision for a conflict result", () => {
      pushConflictTaskScenario();

      const results = getResults();
      expect(results.tasks![0]).not.toHaveProperty("revision");
    });

    it("should NOT return top-level revision when all records are conflict", () => {
      pushConflictTaskScenario();

      expect(parseResponse()).not.toHaveProperty("revision");
    });

    it("should NOT return top-level revision for empty push", () => {
      push({});

      expect(parseResponse()).not.toHaveProperty("revision");
    });

    it("should NOT save next_revision when no records were created or accepted", () => {
      push({});
      expect(saveNextRevision).not.toHaveBeenCalled();
    });

    it.each([
      {
        entityName: "task",
        revision: 7,
        makePush: () =>
          push({
            tasks: [makeTask({ id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" })],
          }),
        getUpsertMock: () => vi.mocked(upsertTasks),
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
      },
      {
        entityName: "goal",
        revision: 9,
        makePush: () =>
          push({
            goals: [makeGoal({ id: "22222222-2222-4222-a222-222222222222" })],
          }),
        getUpsertMock: () => vi.mocked(upsertGoals),
        id: "22222222-2222-4222-a222-222222222222",
      },
      {
        entityName: "context",
        revision: 11,
        makePush: () =>
          push({
            contexts: [
              makeContext({ id: "33333333-3333-4333-a333-333333333333" }),
            ],
          }),
        getUpsertMock: () => vi.mocked(upsertContexts),
        id: "33333333-3333-4333-a333-333333333333",
      },
      {
        entityName: "category",
        revision: 13,
        makePush: () =>
          push({
            categories: [
              makeCategory({ id: "44444444-4444-4444-a444-444444444444" }),
            ],
          }),
        getUpsertMock: () => vi.mocked(upsertCategories),
        id: "44444444-4444-4444-a444-444444444444",
      },
      {
        entityName: "checklist item",
        revision: 15,
        makePush: () =>
          push({
            checklist_items: [
              makeChecklistItem({ id: "55555555-5555-4555-a555-555555555555" }),
            ],
          }),
        getUpsertMock: () => vi.mocked(upsertChecklistItems),
        id: "55555555-5555-4555-a555-555555555555",
      },
    ])("should save pushRevision on $entityName written to the sheet", ({
      revision,
      makePush,
      getUpsertMock,
      id,
    }) => {
      vi.mocked(readNextRevision).mockReturnValue(revision);
      makePush();
      expect(getUpsertMock()).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id, revision })]),
      );
    });
  });
});
