import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../../src/helpers/constants";
import { recordToRow, upsertRecords } from "../../src/sheets/base";
import * as client from "../../src/sheets/client";
import { makeTask } from "../helpers";

vi.mock("../../src/sheets/client");

describe("recordToRow - date handling", () => {
  it("should convert string next_date to prefixed value", () => {
    const task = makeTask({ next_date: "2026-04-20" });
    const row = recordToRow(SHEET_NAMES.TASKS, task);
    const nextDateIndex = 11; // next_date column index
    expect(row[nextDateIndex]).toBe("'2026-04-20");
  });

  it("should convert Date object in next_date to prefixed ISO date", () => {
    const task = makeTask({
      next_date: new Date("2026-04-20T00:00:00Z") as any,
    });
    const row = recordToRow(SHEET_NAMES.TASKS, task);
    const nextDateIndex = 11;
    expect(row[nextDateIndex]).toBe("'2026-04-20");
  });

  it("should convert string appear_date to prefixed value", () => {
    const task = makeTask({ appear_date: "2026-04-21" });
    const row = recordToRow(SHEET_NAMES.TASKS, task);
    const appearDateIndex = 12; // appear_date column index
    expect(row[appearDateIndex]).toBe("'2026-04-21");
  });

  it("should return empty string for empty next_date", () => {
    const task = makeTask({ next_date: "" });
    const row = recordToRow(SHEET_NAMES.TASKS, task);
    const nextDateIndex = 11;
    expect(row[nextDateIndex]).toBe("");
  });

  it("should not convert created_at timestamp", () => {
    const task = makeTask({ created_at: "2025-01-01T00:00:00.000Z" });
    const row = recordToRow(SHEET_NAMES.TASKS, task);
    const createdAtIndex = 16; // created_at column index
    expect(row[createdAtIndex]).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("upsertRecords - row isolation", () => {
  let mockSheet: any;

  beforeEach(() => {
    mockSheet = {
      getDataRange: vi.fn(),
      getRange: vi.fn(),
      appendRow: vi.fn(),
    };
    vi.mocked(client.getSheet).mockReturnValue(mockSheet);
  });

  it("should not overwrite untouched rows", () => {
    const task2 = makeTask({
      id: "task-2",
      name: "Task 2",
      next_date: "2026-04-21",
    });

    // Simulate existing data with task1 having prefixed date
    const existingData = [
      [
        "id",
        "name",
        "description",
        "box",
        "goal_id",
        "context_id",
        "category_id",
        "is_completed",
        "completed_at",
        "repeat_rule",
        "is_hidden",
        "next_date",
        "appear_date",
        "original_task_id",
        "sort_order",
        "is_deleted",
        "created_at",
        "updated_at",
        "version",
        "revision",
      ],
      [
        "task-1",
        "Task 1",
        "",
        "inbox",
        "",
        "",
        "",
        false,
        "",
        "",
        false,
        "'2026-04-20",
        "",
        "",
        0,
        false,
        "2025-01-01T00:00:00.000Z",
        "2025-01-01T00:00:00.000Z",
        1,
        0,
      ],
      [
        "task-2",
        "Task 2",
        "",
        "inbox",
        "",
        "",
        "",
        false,
        "",
        "",
        false,
        "'2026-04-21",
        "",
        "",
        0,
        false,
        "2025-01-01T00:00:00.000Z",
        "2025-01-01T00:00:00.000Z",
        1,
        0,
      ],
    ];

    mockSheet.getDataRange.mockReturnValue({
      getValues: () => existingData,
    });

    const mockRange = {
      setValues: vi.fn(),
    };
    mockSheet.getRange.mockReturnValue(mockRange);

    // Update only task2
    upsertRecords(SHEET_NAMES.TASKS, [{ ...task2, name: "Task 2 Updated" }]);

    // Should call setValues only for task2's row
    expect(mockRange.setValues).toHaveBeenCalledTimes(1);
    const calledRow = mockRange.setValues.mock.calls[0][0][0];
    expect(calledRow[0]).toBe("task-2"); // id
    expect(calledRow[1]).toBe("Task 2 Updated"); // name
  });

  it("should call setValues separately for each updated row", () => {
    const task1 = makeTask({ id: "task-1", name: "Task 1" });
    const task2 = makeTask({ id: "task-2", name: "Task 2" });

    const existingData = [
      [
        "id",
        "name",
        "description",
        "box",
        "goal_id",
        "context_id",
        "category_id",
        "is_completed",
        "completed_at",
        "repeat_rule",
        "is_hidden",
        "next_date",
        "appear_date",
        "original_task_id",
        "sort_order",
        "is_deleted",
        "created_at",
        "updated_at",
        "version",
        "revision",
      ],
      [
        "task-1",
        "Task 1",
        "",
        "inbox",
        "",
        "",
        "",
        false,
        "",
        "",
        false,
        "",
        "",
        "",
        0,
        false,
        "2025-01-01T00:00:00.000Z",
        "2025-01-01T00:00:00.000Z",
        1,
        0,
      ],
      [
        "task-2",
        "Task 2",
        "",
        "inbox",
        "",
        "",
        "",
        false,
        "",
        "",
        false,
        "",
        "",
        "",
        0,
        false,
        "2025-01-01T00:00:00.000Z",
        "2025-01-01T00:00:00.000Z",
        1,
        0,
      ],
    ];

    mockSheet.getDataRange.mockReturnValue({
      getValues: () => existingData,
    });

    const mockRange = {
      setValues: vi.fn(),
    };
    mockSheet.getRange.mockReturnValue(mockRange);

    // Update both tasks
    upsertRecords(SHEET_NAMES.TASKS, [
      { ...task1, name: "Task 1 Updated" },
      { ...task2, name: "Task 2 Updated" },
    ]);

    // Should call setValues twice (once per updated row)
    expect(mockRange.setValues).toHaveBeenCalledTimes(2);
  });

  it("should use appendRow for new records", () => {
    const newTask = makeTask({ id: "task-new", name: "New Task" });

    const existingData = [
      [
        "id",
        "name",
        "description",
        "box",
        "goal_id",
        "context_id",
        "category_id",
        "is_completed",
        "completed_at",
        "repeat_rule",
        "is_hidden",
        "next_date",
        "appear_date",
        "original_task_id",
        "sort_order",
        "is_deleted",
        "created_at",
        "updated_at",
        "version",
        "revision",
      ],
    ];

    mockSheet.getDataRange.mockReturnValue({
      getValues: () => existingData,
    });

    upsertRecords(SHEET_NAMES.TASKS, [newTask]);

    expect(mockSheet.appendRow).toHaveBeenCalledTimes(1);
  });
});
