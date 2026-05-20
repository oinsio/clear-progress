import { describe, expect, it, vi } from "vitest";
import { PUSH_STATUSES } from "../helpers/constants";
import { upsertChecklistItems } from "../sheets/checklists.sheet";
import { upsertTasks } from "../sheets/tasks.sheet";
import { push } from "./push";
import {
  assertChecklistItemHasReason,
  assertChecklistItemStatus,
  assertMixedTaskBatch,
  assertTaskHasReason,
  assertTaskStatus,
  getResults,
  makeChecklistItem,
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

const VALID_FK_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

describe("push", () => {
  setupPushTests();

  describe("rejected record (invalid foreign key)", () => {
    describe("Task optional FKs (goal_id, context_id, category_id)", () => {
      it("should return status: rejected for task with invalid goal_id", () => {
        assertTaskStatus({ goal_id: "not-a-uuid" }, PUSH_STATUSES.REJECTED);
      });

      it("should not upsert any task when task has invalid goal_id", () => {
        push({ tasks: [makeTask({ goal_id: "not-a-uuid" })] });
        expect(upsertTasks).toHaveBeenCalledWith([]);
      });

      it("should return status: rejected for task with invalid context_id", () => {
        assertTaskStatus({ context_id: "!!!" }, PUSH_STATUSES.REJECTED);
      });

      it("should return status: rejected for task with invalid category_id", () => {
        assertTaskStatus({ category_id: "bad-id" }, PUSH_STATUSES.REJECTED);
      });

      it("should NOT reject task when goal_id is empty string", () => {
        assertTaskStatus({ goal_id: "" }, PUSH_STATUSES.CREATED);
      });

      it("should NOT reject task when goal_id is a valid UUID", () => {
        assertTaskStatus({ goal_id: VALID_FK_UUID }, PUSH_STATUSES.CREATED);
      });

      it("should include reason field in rejected result for invalid FK", () => {
        assertTaskHasReason({ goal_id: "not-a-uuid" });
      });
    });

    describe("ChecklistItem required task_id", () => {
      it("should return status: rejected for checklist_item with empty task_id", () => {
        assertChecklistItemStatus({ task_id: "" }, PUSH_STATUSES.REJECTED);
      });

      it("should not upsert any checklist item when task_id is empty", () => {
        push({ checklist_items: [makeChecklistItem({ task_id: "" })] });
        expect(upsertChecklistItems).toHaveBeenCalledWith([]);
      });

      it("should return status: rejected for checklist_item with invalid task_id format", () => {
        assertChecklistItemStatus(
          { task_id: "not-a-uuid" },
          PUSH_STATUSES.REJECTED,
        );
      });

      it("should NOT reject checklist_item when task_id is a valid UUID", () => {
        assertChecklistItemStatus(
          { task_id: VALID_FK_UUID },
          PUSH_STATUSES.CREATED,
        );
      });

      it("should include reason field in rejected result for missing task_id", () => {
        assertChecklistItemHasReason({ task_id: "" });
      });

      it("should use a different reason for missing required FK vs invalid optional FK", () => {
        push({
          tasks: [makeTask({ goal_id: "bad" })],
          checklist_items: [makeChecklistItem({ task_id: "" })],
        });

        const results = getResults();
        const taskReason = (
          results.tasks![0] as unknown as Record<string, unknown>
        ).reason;
        const itemReason = (
          results.checklist_items![0] as unknown as Record<string, unknown>
        ).reason;
        expect(taskReason).not.toBe(itemReason);
      });
    });

    describe("mixed batch with FK errors", () => {
      it("should process valid task alongside task with invalid FK in same array", () => {
        assertMixedTaskBatch(
          makeTask({ id: "a7b8c9d0-e1f2-4345-89ab-cdef01234567" }),
          makeTask({ goal_id: "bad-fk" }),
        );
      });
    });
  });
});
