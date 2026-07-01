import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { filterTaskNamesWithInvalidRepeatRules } from "./repeatRuleValidation";

// Implements FR5, FR9 of detect-invalid-repeat-rule
describe("filterTaskNamesWithInvalidRepeatRules", () => {
  it("should include active incomplete task with invalid repeat rule", () => {
    const tasks = [
      buildTask({
        name: "Bad rule task",
        repeat_rule: "not-a-json",
        is_deleted: false,
        is_completed: false,
      }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual(["Bad rule task"]);
  });

  it("should include multiple tasks with invalid repeat rules", () => {
    const tasks = [
      buildTask({
        name: "First bad",
        repeat_rule: "{invalid}",
        is_deleted: false,
        is_completed: false,
      }),
      buildTask({
        name: "Second bad",
        repeat_rule: "broken-json",
        is_deleted: false,
        is_completed: false,
      }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual(["First bad", "Second bad"]);
  });

  it("should exclude task with valid repeat rule", () => {
    const validRule = JSON.stringify({
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "inbox",
      advance_days: 0,
    });
    const tasks = [
      buildTask({
        name: "Valid task",
        repeat_rule: validRule,
        is_deleted: false,
        is_completed: false,
      }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual([]);
  });

  it("should exclude task with empty repeat rule", () => {
    const tasks = [
      buildTask({
        name: "No rule task",
        repeat_rule: "",
        is_deleted: false,
        is_completed: false,
      }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual([]);
  });

  it("should exclude deleted task with invalid repeat rule", () => {
    const tasks = [
      buildTask({
        name: "Deleted task",
        repeat_rule: "not-valid",
        is_deleted: true,
        is_completed: false,
      }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual([]);
  });

  it("should exclude completed task with invalid repeat rule", () => {
    const tasks = [
      buildTask({
        name: "Completed task",
        repeat_rule: "not-valid",
        is_deleted: false,
        is_completed: true,
      }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual([]);
  });

  it("should return empty array when all tasks have valid rules", () => {
    const validRule = JSON.stringify({
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5],
      target_box: "inbox",
      advance_days: 0,
    });
    const tasks = [
      buildTask({ name: "A", repeat_rule: validRule }),
      buildTask({ name: "B", repeat_rule: "" }),
    ];

    const result = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(result).toEqual([]);
  });

  it("should include same task on subsequent calls (no persistence)", () => {
    const tasks = [
      buildTask({
        name: "Persistent bad",
        repeat_rule: "invalid",
        is_deleted: false,
        is_completed: false,
      }),
    ];

    const firstResult = filterTaskNamesWithInvalidRepeatRules(tasks);
    const secondResult = filterTaskNamesWithInvalidRepeatRules(tasks);

    expect(firstResult).toEqual(["Persistent bad"]);
    expect(secondResult).toEqual(["Persistent bad"]);
  });
});
