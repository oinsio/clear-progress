import { describe, expect, it, vi } from "vitest";
import { PUSH_STATUSES } from "../helpers/constants";
import { upsertCategories } from "../sheets/categories.sheet";
import { upsertChecklistItems } from "../sheets/checklists.sheet";
import { upsertContexts } from "../sheets/contexts.sheet";
import { upsertGoals } from "../sheets/goals.sheet";
import { upsertTasks } from "../sheets/tasks.sheet";
import type { Category, ChecklistItem, Context, Goal, Task } from "../types";
import { push } from "./push";
import {
  describeCommonRejectionTests,
  getResults,
  makeCategory,
  makeChecklistItem,
  makeContext,
  makeGoal,
  makeTask,
  setupPushTests,
} from "./push-test-utils";

vi.mock("../sheets/tasks.sheet");
vi.mock("../sheets/goals.sheet");
vi.mock("../sheets/contexts.sheet");
vi.mock("../sheets/categories.sheet");
vi.mock("../sheets/checklists.sheet");
vi.mock("../sheets/settings.sheet");
vi.mock("../sheets/meta.sheet");

type PushPayloadKey =
  | "tasks"
  | "goals"
  | "contexts"
  | "categories"
  | "checklist_items";

type EntityRecord = Task | Goal | Context | Category | ChecklistItem;

const ENTITY_CASES: Array<{
  entityName: string;
  payloadKey: PushPayloadKey;
  makeRecord: (overrides?: Partial<EntityRecord>) => EntityRecord;
  upsertMock: () => unknown;
  testId: string;
}> = [
  {
    entityName: "task",
    payloadKey: "tasks",
    makeRecord: makeTask,
    upsertMock: () => upsertTasks,
    testId: "cccccccc-cccc-4ccc-accc-cccccccccccc",
  },
  {
    entityName: "goal",
    payloadKey: "goals",
    makeRecord: makeGoal,
    upsertMock: () => upsertGoals,
    testId: "ffffffff-ffff-4fff-afff-ffffffffffff",
  },
  {
    entityName: "context",
    payloadKey: "contexts",
    makeRecord: makeContext,
    upsertMock: () => upsertContexts,
    testId: "b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2",
  },
  {
    entityName: "category",
    payloadKey: "categories",
    makeRecord: makeCategory,
    upsertMock: () => upsertCategories,
    testId: "d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4",
  },
  {
    entityName: "checklist_item",
    payloadKey: "checklist_items",
    makeRecord: makeChecklistItem,
    upsertMock: () => upsertChecklistItems,
    testId: "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0",
  },
];

describe("push", () => {
  setupPushTests();

  describe("rejected record (blank name/name)", () => {
    describe.each(ENTITY_CASES)("$entityName", ({
      payloadKey,
      makeRecord,
      upsertMock,
      testId,
    }) => {
      it("should return status: rejected with empty name", () => {
        const blankRecord = makeRecord({ id: testId, name: "" });

        push({ [payloadKey]: [blankRecord] });

        const results = getResults();
        expect(results[payloadKey]![0]).toMatchObject({
          id: testId,
          status: PUSH_STATUSES.REJECTED,
        });
      });

      it("should not upsert when name is empty", () => {
        const blankRecord = makeRecord({ name: "" });

        push({ [payloadKey]: [blankRecord] });

        expect(upsertMock()).toHaveBeenCalledWith([]);
      });
    });

    it("should return status: rejected for task with whitespace-only name", () => {
      const blankTask = makeTask({
        id: "dddddddd-dddd-4ddd-addd-dddddddddddd",
        name: "   ",
      });

      push({ tasks: [blankTask] });

      const results = getResults();
      expect(results.tasks![0]).toMatchObject({
        id: "dddddddd-dddd-4ddd-addd-dddddddddddd",
        status: PUSH_STATUSES.REJECTED,
      });
    });

    describeCommonRejectionTests(
      () => makeTask({ name: "" }),
      () =>
        makeTask({
          id: "a7b8c9d0-e1f2-4345-89ab-cdef01234567",
          name: "Valid task",
        }),
    );
  });
});
