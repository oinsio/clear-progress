// implements FR1 of fix-push-poison-pill
import { beforeEach, describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { healRecord } from "./healRecord";
import type { HealResult } from "./types";

const FIXED_CLOCK = fakeClock("2026-06-27T10:00:00Z");
const FIXED_TIMESTAMP = toISOTimestamp(FIXED_CLOCK);

function buildValidTask(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    name: "Test task",
    description: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    is_hidden: false,
    next_date: "",
    appear_date: "",
    original_task_id: "",
    sort_order: "a0",
    is_deleted: false,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    revision: 0,
    ...overrides,
  };
}

function buildValidGoal(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    name: "Test goal",
    description: "",
    cover_hash: "",
    status: "planning",
    sort_order: "a0",
    is_deleted: false,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    revision: 0,
    ...overrides,
  };
}

function buildValidChecklistItem(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    task_id: crypto.randomUUID(),
    name: "Check item",
    is_completed: false,
    sort_order: "a0",
    is_deleted: false,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    revision: 0,
    ...overrides,
  };
}

function buildValidAttachment(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    entity_type: "task",
    entity_id: crypto.randomUUID(),
    data_hash: "abc123",
    filename: "file.txt",
    mime_type: "text/plain",
    file_size: 100,
    sort_order: "a0",
    is_deleted: false,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    revision: 0,
    ...overrides,
  };
}

describe("healRecord", () => {
  let clock: ReturnType<typeof fakeClock>;

  beforeEach(() => {
    clock = fakeClock("2026-06-27T10:00:00Z");
  });

  describe("valid records", () => {
    it("should pass through a valid task with status 'valid'", () => {
      const validTask = buildValidTask();
      const result: HealResult = healRecord(validTask, "task", clock);

      expect(result.status).toBe("valid");
      expect(result.record).toEqual(validTask);
      expect(result.alerts).toEqual([]);
    });

    it("should pass through a valid goal with status 'valid'", () => {
      const validGoal = buildValidGoal();
      const result = healRecord(validGoal, "goal", clock);

      expect(result.status).toBe("valid");
      expect(result.record).toEqual(validGoal);
      expect(result.alerts).toEqual([]);
    });
  });

  describe("healable: invalid timestamps", () => {
    it("should heal invalid created_at with current timestamp", () => {
      const taskWithBadTimestamp = buildValidTask({
        created_at: "not-a-timestamp",
      });
      const result = healRecord(taskWithBadTimestamp, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.created_at).toBe(FIXED_TIMESTAMP);
      expect(result.alerts).toEqual([]);
    });

    it("should heal invalid updated_at with current timestamp", () => {
      const taskWithBadTimestamp = buildValidTask({
        updated_at: "2026/06/27",
      });
      const result = healRecord(taskWithBadTimestamp, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.updated_at).toBe(FIXED_TIMESTAMP);
      expect(result.alerts).toEqual([]);
    });
  });

  describe("healable: invalid FK fields", () => {
    it("should heal invalid goal_id (not UUID, not empty) with empty string", () => {
      const taskWithBadFk = buildValidTask({ goal_id: "not-a-uuid" });
      const result = healRecord(taskWithBadFk, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.goal_id).toBe("");
      expect(result.alerts).toEqual([]);
    });

    it("should heal invalid context_id with empty string", () => {
      const taskWithBadFk = buildValidTask({ context_id: "corrupted" });
      const result = healRecord(taskWithBadFk, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.context_id).toBe("");
    });

    it("should heal invalid category_id with empty string", () => {
      const taskWithBadFk = buildValidTask({ category_id: "bad" });
      const result = healRecord(taskWithBadFk, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.category_id).toBe("");
    });

    it("should heal invalid original_task_id with empty string", () => {
      const taskWithBadFk = buildValidTask({
        original_task_id: "not-uuid",
      });
      const result = healRecord(taskWithBadFk, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.original_task_id).toBe("");
    });
  });

  describe("healable: invalid booleans", () => {
    it("should heal invalid is_completed with false", () => {
      const taskWithBadBoolean = buildValidTask({
        is_completed: "yes" as unknown,
      });
      const result = healRecord(taskWithBadBoolean, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.is_completed).toBe(false);
    });

    it("should heal invalid is_hidden with false", () => {
      const taskWithBadBoolean = buildValidTask({
        is_hidden: 1 as unknown,
      });
      const result = healRecord(taskWithBadBoolean, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.is_hidden).toBe(false);
    });
  });

  describe("healable: invalid completed_at", () => {
    it("should heal invalid completed_at with empty string", () => {
      const taskWithBadCompletedAt = buildValidTask({
        completed_at: "not-valid",
      });
      const result = healRecord(taskWithBadCompletedAt, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.completed_at).toBe("");
    });
  });

  describe("healable: invalid date fields", () => {
    it("should heal invalid next_date with empty string", () => {
      const taskWithBadDate = buildValidTask({ next_date: "2026/06/27" });
      const result = healRecord(taskWithBadDate, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.next_date).toBe("");
    });

    it("should heal invalid appear_date with empty string", () => {
      const taskWithBadDate = buildValidTask({ appear_date: "bad-date" });
      const result = healRecord(taskWithBadDate, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.appear_date).toBe("");
    });
  });

  describe("healable: invalid repeat_rule", () => {
    it("should heal non-string repeat_rule with empty string and generate alert", () => {
      const taskWithBadRepeatRule = buildValidTask({
        repeat_rule: 123 as unknown,
      });
      const result = healRecord(taskWithBadRepeatRule, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.repeat_rule).toBe("");
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].messageKey).toBe("sync.alert.repeat_rule_reset");
    });
  });

  describe("healable: missing name", () => {
    it("should heal empty name with '(untitled)' and generate alert", () => {
      const taskWithEmptyName = buildValidTask({ name: "" });
      const result = healRecord(taskWithEmptyName, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.name).toBe("(untitled)");
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].messageKey).toBe("sync.alert.name_set_untitled");
    });
  });

  describe("healable: missing sort_order", () => {
    it("should heal empty sort_order with '0'", () => {
      const taskWithEmptySortOrder = buildValidTask({ sort_order: "" });
      const result = healRecord(taskWithEmptySortOrder, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.sort_order).toBe("0");
    });
  });

  describe("healable: missing box", () => {
    it("should heal empty box with 'inbox'", () => {
      const taskWithEmptyBox = buildValidTask({ box: "" });
      const result = healRecord(taskWithEmptyBox, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.box).toBe("inbox");
    });
  });

  describe("healable: invalid file_size", () => {
    it("should heal non-number file_size with 0", () => {
      const attachmentWithBadSize = buildValidAttachment({
        file_size: "big" as unknown,
      });
      const result = healRecord(attachmentWithBadSize, "attachment", clock);

      expect(result.status).toBe("healed");
      expect(result.record.file_size).toBe(0);
    });
  });

  describe("healable: checklist item with invalid task_id", () => {
    it("should set is_deleted to true for checklist item with invalid task_id", () => {
      const checklistItemWithBadTaskId = buildValidChecklistItem({
        task_id: "not-a-uuid",
      });
      const result = healRecord(
        checklistItemWithBadTaskId,
        "checklist_item",
        clock,
      );

      expect(result.status).toBe("healed");
      expect(result.record.is_deleted).toBe(true);
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].messageKey).toBe(
        "sync.alert.checklist_item_deleted",
      );
    });
  });

  describe("unhealable: invalid id", () => {
    it("should reject a task with invalid id", () => {
      const taskWithBadId = buildValidTask({ id: "not-a-uuid" });
      const result = healRecord(taskWithBadId, "task", clock);

      expect(result.status).toBe("rejected");
      expect(result.alerts).toEqual([]);
    });
  });

  describe("unhealable: invalid box enum", () => {
    it("should reject a task with invalid box enum value", () => {
      const taskWithBadBox = buildValidTask({ box: "unknown_box" });
      const result = healRecord(taskWithBadBox, "task", clock);

      expect(result.status).toBe("rejected");
    });
  });

  describe("unhealable: invalid goal status enum", () => {
    it("should reject a goal with invalid status enum value", () => {
      const goalWithBadStatus = buildValidGoal({ status: "unknown_status" });
      const result = healRecord(goalWithBadStatus, "goal", clock);

      expect(result.status).toBe("rejected");
    });
  });

  describe("unhealable: invalid entity_type enum", () => {
    it("should reject an attachment with invalid entity_type", () => {
      const attachmentWithBadEntityType = buildValidAttachment({
        entity_type: "unknown",
      });
      const result = healRecord(
        attachmentWithBadEntityType,
        "attachment",
        clock,
      );

      expect(result.status).toBe("rejected");
    });
  });

  describe("multiple invalid fields", () => {
    it("should heal all healable fields in a single record", () => {
      const taskWithMultipleIssues = buildValidTask({
        created_at: "bad",
        goal_id: "bad",
        is_completed: "yes" as unknown,
        next_date: "bad",
      });
      const result = healRecord(taskWithMultipleIssues, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.created_at).toBe(FIXED_TIMESTAMP);
      expect(result.record.goal_id).toBe("");
      expect(result.record.is_completed).toBe(false);
      expect(result.record.next_date).toBe("");
    });

    it("should reject if any field is unhealable even when others are healable", () => {
      const taskWithMixedIssues = buildValidTask({
        id: "bad-id",
        created_at: "bad",
      });
      const result = healRecord(taskWithMixedIssues, "task", clock);

      expect(result.status).toBe("rejected");
    });

    it("should preserve pre-healing alerts when Zod also finds errors", () => {
      const taskWithNameAndTimestamp = buildValidTask({
        name: "",
        created_at: "bad",
      });
      const result = healRecord(taskWithNameAndTimestamp, "task", clock);

      expect(result.status).toBe("healed");
      expect(result.record.name).toBe("(untitled)");
      expect(result.record.created_at).toBe(FIXED_TIMESTAMP);
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].messageKey).toBe("sync.alert.name_set_untitled");
    });
  });

  describe("unhealable via tryHealField returning false", () => {
    it("should reject when Zod reports error for field tryHealField cannot heal", () => {
      // description is a string field; setting it to number triggers Zod error
      // but tryHealField does not handle "description", so it returns false
      const taskWithBadDescription = buildValidTask({
        description: 123 as unknown,
      });
      const result = healRecord(taskWithBadDescription, "task", clock);

      expect(result.status).toBe("rejected");
      expect(result.record).toEqual(taskWithBadDescription);
      expect(result.alerts).toEqual([]);
    });
  });

  describe("settings entity type", () => {
    it("should pass through a valid setting with status 'valid'", () => {
      const validSetting = {
        key: "theme",
        value: "dark",
        updated_at: FIXED_TIMESTAMP,
      };
      const result = healRecord(validSetting, "setting", clock);

      expect(result.status).toBe("valid");
      expect(result.record).toEqual(validSetting);
    });

    it("should heal invalid updated_at in setting", () => {
      const settingWithBadTimestamp = {
        key: "theme",
        value: "dark",
        updated_at: "bad",
      };
      const result = healRecord(settingWithBadTimestamp, "setting", clock);

      expect(result.status).toBe("healed");
      expect(result.record.updated_at).toBe(FIXED_TIMESTAMP);
    });
  });
});
