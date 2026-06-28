// implements FR1 of fix-push-poison-pill
import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { tryHealField } from "./fieldHealer";
import type { SyncAlert } from "./types";

const FIXED_CLOCK = fakeClock("2026-06-27T10:00:00Z");
const FIXED_TIMESTAMP = toISOTimestamp(FIXED_CLOCK);

function runHeal(
  fieldName: string,
  value: unknown,
  entityType: "task" | "goal" | "checklist_item" | "attachment" = "task",
): { isHealed: boolean; record: Record<string, unknown>; alerts: SyncAlert[] } {
  const record: Record<string, unknown> = { [fieldName]: value };
  const alerts: SyncAlert[] = [];
  const isHealed = tryHealField(
    fieldName,
    record,
    entityType,
    alerts,
    FIXED_CLOCK,
  );
  return { isHealed, record, alerts };
}

describe("tryHealField", () => {
  describe("timestamp fields", () => {
    it("should heal invalid created_at", () => {
      const { isHealed, record } = runHeal("created_at", "bad");
      expect(isHealed).toBe(true);
      expect(record.created_at).toBe(FIXED_TIMESTAMP);
    });

    it("should not heal valid created_at", () => {
      const { isHealed } = runHeal("created_at", FIXED_TIMESTAMP);
      expect(isHealed).toBe(false);
    });

    it("should heal invalid updated_at", () => {
      const { isHealed, record } = runHeal("updated_at", 123);
      expect(isHealed).toBe(true);
      expect(record.updated_at).toBe(FIXED_TIMESTAMP);
    });

    it("should not heal valid updated_at", () => {
      const { isHealed } = runHeal("updated_at", FIXED_TIMESTAMP);
      expect(isHealed).toBe(false);
    });
  });

  describe("FK fields", () => {
    it.each([
      "goal_id",
      "context_id",
      "category_id",
      "original_task_id",
    ])("should heal invalid %s with empty string", (fieldName) => {
      const { isHealed, record } = runHeal(fieldName, "not-uuid");
      expect(isHealed).toBe(true);
      expect(record[fieldName]).toBe("");
    });

    it("should not heal valid goal_id (UUID)", () => {
      const { isHealed } = runHeal("goal_id", crypto.randomUUID());
      expect(isHealed).toBe(false);
    });

    it("should not heal valid goal_id (empty string)", () => {
      const { isHealed } = runHeal("goal_id", "");
      expect(isHealed).toBe(false);
    });
  });

  describe("checklist item task_id", () => {
    it("should mark deleted for invalid task_id on checklist_item", () => {
      const { isHealed, record, alerts } = runHeal(
        "task_id",
        "bad",
        "checklist_item",
      );
      expect(isHealed).toBe(true);
      expect(record.is_deleted).toBe(true);
      expect(record.task_id).toBe("00000000-0000-0000-0000-000000000000");
      expect(alerts).toHaveLength(1);
    });

    it("should not heal valid task_id on checklist_item", () => {
      const { isHealed } = runHeal(
        "task_id",
        crypto.randomUUID(),
        "checklist_item",
      );
      expect(isHealed).toBe(false);
    });

    it("should not heal task_id on non-checklist entity", () => {
      const { isHealed } = runHeal("task_id", "bad", "task");
      expect(isHealed).toBe(false);
    });
  });

  describe("boolean fields", () => {
    it.each([
      "is_completed",
      "is_hidden",
      "is_deleted",
    ])("should heal non-boolean %s with false", (fieldName) => {
      const { isHealed, record } = runHeal(fieldName, "yes");
      expect(isHealed).toBe(true);
      expect(record[fieldName]).toBe(false);
    });

    it("should not heal valid boolean is_completed", () => {
      const { isHealed } = runHeal("is_completed", true);
      expect(isHealed).toBe(false);
    });

    it("should heal non-boolean is_completed on checklist_item", () => {
      const { isHealed, record } = runHeal(
        "is_completed",
        "yes",
        "checklist_item",
      );
      expect(isHealed).toBe(true);
      expect(record.is_completed).toBe(false);
      // Should NOT set is_deleted or task_id (those are task_id-specific healing)
      expect(record.is_deleted).toBeUndefined();
    });
  });

  describe("completed_at", () => {
    it("should heal invalid completed_at with empty string", () => {
      const { isHealed, record } = runHeal("completed_at", "bad");
      expect(isHealed).toBe(true);
      expect(record.completed_at).toBe("");
    });

    it("should not heal valid completed_at (empty)", () => {
      const { isHealed } = runHeal("completed_at", "");
      expect(isHealed).toBe(false);
    });

    it("should not heal valid completed_at (timestamp)", () => {
      const { isHealed } = runHeal("completed_at", FIXED_TIMESTAMP);
      expect(isHealed).toBe(false);
    });
  });

  describe("date fields", () => {
    it.each([
      "next_date",
      "appear_date",
    ])("should heal invalid %s with empty string", (fieldName) => {
      const { isHealed, record } = runHeal(fieldName, "bad");
      expect(isHealed).toBe(true);
      expect(record[fieldName]).toBe("");
    });

    it("should not heal valid next_date (empty)", () => {
      const { isHealed } = runHeal("next_date", "");
      expect(isHealed).toBe(false);
    });

    it("should not heal valid next_date (ISO date)", () => {
      const { isHealed } = runHeal("next_date", "2026-06-27");
      expect(isHealed).toBe(false);
    });
  });

  describe("repeat_rule", () => {
    it("should heal non-string repeat_rule", () => {
      const { isHealed, record, alerts } = runHeal("repeat_rule", 123);
      expect(isHealed).toBe(true);
      expect(record.repeat_rule).toBe("");
      expect(alerts).toHaveLength(1);
    });

    it("should not heal valid string repeat_rule", () => {
      const { isHealed } = runHeal("repeat_rule", "FREQ=DAILY");
      expect(isHealed).toBe(false);
    });
  });

  describe("name", () => {
    it("should heal empty name", () => {
      const { isHealed, record, alerts } = runHeal("name", "");
      expect(isHealed).toBe(true);
      expect(record.name).toBe("(untitled)");
      expect(alerts).toHaveLength(1);
    });

    it("should heal null name", () => {
      const { isHealed, record } = runHeal("name", null);
      expect(isHealed).toBe(true);
      expect(record.name).toBe("(untitled)");
    });

    it("should heal non-string truthy name (number)", () => {
      const { isHealed, record } = runHeal("name", 123);
      expect(isHealed).toBe(true);
      expect(record.name).toBe("(untitled)");
    });

    it("should not heal valid name", () => {
      const { isHealed } = runHeal("name", "My task");
      expect(isHealed).toBe(false);
    });
  });

  describe("sort_order", () => {
    it("should heal empty sort_order", () => {
      const { isHealed, record } = runHeal("sort_order", "");
      expect(isHealed).toBe(true);
      expect(record.sort_order).toBe("0");
    });

    it("should heal falsy sort_order", () => {
      const { isHealed, record } = runHeal("sort_order", null);
      expect(isHealed).toBe(true);
      expect(record.sort_order).toBe("0");
    });

    it("should not heal valid sort_order", () => {
      const { isHealed } = runHeal("sort_order", "a0");
      expect(isHealed).toBe(false);
    });
  });

  describe("file_size", () => {
    it("should heal non-number file_size", () => {
      const { isHealed, record } = runHeal("file_size", "big", "attachment");
      expect(isHealed).toBe(true);
      expect(record.file_size).toBe(0);
    });

    it("should not heal valid number file_size", () => {
      const { isHealed } = runHeal("file_size", 100, "attachment");
      expect(isHealed).toBe(false);
    });
  });

  describe("unknown field", () => {
    it("should return false for unrecognized field", () => {
      const { isHealed } = runHeal("unknown_field", "bad");
      expect(isHealed).toBe(false);
    });
  });
});
