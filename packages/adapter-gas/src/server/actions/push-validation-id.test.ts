import { describe, expect, it, vi } from "vitest";
import { PUSH_STATUSES } from "../helpers/constants";
import { upsertCategories } from "../sheets/categories.sheet";
import { upsertChecklistItems } from "../sheets/checklists.sheet";
import { upsertContexts } from "../sheets/contexts.sheet";
import { upsertGoals } from "../sheets/goals.sheet";
import { upsertTasks } from "../sheets/tasks.sheet";
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

const entityCases: Array<{
  entityName: string;
  payloadKey: PushPayloadKey;
  makeRecord: (overrides: { id: string; name: string }) => unknown;
  getUpsertMock: () => unknown;
  invalidIds: string[];
}> = [
  {
    entityName: "task",
    payloadKey: "tasks",
    makeRecord: makeTask,
    getUpsertMock: () => upsertTasks,
    invalidIds: ["", "!!!###$$$", "not-a-uuid"],
  },
  {
    entityName: "goal",
    payloadKey: "goals",
    makeRecord: makeGoal,
    getUpsertMock: () => upsertGoals,
    invalidIds: ["", "bad-id"],
  },
  {
    entityName: "context",
    payloadKey: "contexts",
    makeRecord: makeContext,
    getUpsertMock: () => upsertContexts,
    invalidIds: ["", "!!!"],
  },
  {
    entityName: "category",
    payloadKey: "categories",
    makeRecord: makeCategory,
    getUpsertMock: () => upsertCategories,
    invalidIds: ["", "not-a-uuid"],
  },
  {
    entityName: "checklist_item",
    payloadKey: "checklist_items",
    makeRecord: makeChecklistItem,
    getUpsertMock: () => upsertChecklistItems,
    invalidIds: ["", "bad-id"],
  },
];

describe("push", () => {
  setupPushTests();

  describe("rejected record (invalid id)", () => {
    describe.each(entityCases)("$entityName", ({
      payloadKey,
      makeRecord,
      getUpsertMock,
      invalidIds,
    }) => {
      it.each(
        invalidIds,
      )(`should return status: rejected for invalid id "%s"`, (invalidId) => {
        const record = makeRecord({ id: invalidId, name: "Valid name" });

        push({ [payloadKey]: [record] });

        const results = getResults();
        expect(results[payloadKey]![0]).toMatchObject({
          status: PUSH_STATUSES.REJECTED,
        });
      });

      it("should not upsert any record when id is invalid", () => {
        const record = makeRecord({
          id: invalidIds[0],
          name: "Valid name",
        });

        push({ [payloadKey]: [record] });

        expect(getUpsertMock()).toHaveBeenCalledWith([]);
      });
    });

    describeCommonRejectionTests(
      () => makeTask({ id: "", name: "Valid name" }),
      () =>
        makeTask({
          id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          name: "Valid task",
        }),
    );
  });
});
