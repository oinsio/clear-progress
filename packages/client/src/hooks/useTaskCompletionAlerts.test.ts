// implements FR5 of fix-recurring-completion-error-masking
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { mockAddAlerts } from "@/app/providers/__mocks__/AlertProvider";
import type { RecurringResult } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { useTaskCompletionAlerts } from "./useTaskCompletionAlerts";

vi.mock(
  "@/app/providers/AlertProvider",
  async () => import("@/app/providers/__mocks__/AlertProvider"),
);

describe("useTaskCompletionAlerts", () => {
  beforeEach(() => {
    mockAddAlerts.mockClear();
  });

  describe("when recurringResult status is skipped_invalid_rule", () => {
    it("should call addAlerts once with a repeat_rule_invalid alert for the task name", () => {
      const task = buildTask({ name: "Water the plants" });
      const recurringResult: RecurringResult = {
        status: "skipped_invalid_rule",
      };
      const { result } = renderHook(() => useTaskCompletionAlerts());

      result.current.raiseCompletionAlerts(recurringResult, task.name);

      expect(mockAddAlerts).toHaveBeenCalledOnce();
      expect(mockAddAlerts).toHaveBeenCalledWith([
        { type: "repeat_rule_invalid", taskNames: [task.name] },
      ]);
    });
  });

  describe.each<{ status: RecurringResult["status"] }>([
    { status: "error_creating_copy" },
    { status: "created" },
    { status: "not_recurring" },
  ])("when recurringResult status is $status", ({ status }) => {
    it("should not call addAlerts", () => {
      const task = buildTask({ name: "Water the plants" });
      const recurringResult = (
        status === "created" ? { status, task } : { status }
      ) as RecurringResult;
      const { result } = renderHook(() => useTaskCompletionAlerts());

      result.current.raiseCompletionAlerts(recurringResult, task.name);

      expect(mockAddAlerts).not.toHaveBeenCalled();
    });
  });
});
