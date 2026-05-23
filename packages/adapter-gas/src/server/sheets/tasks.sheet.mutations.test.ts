import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types";
import { getSheet } from "./client";
import { deleteTasksByIds, upsertTasks } from "./tasks.sheet";
import {
  makeSheetMock,
  makeTaskRow,
  TASK_HEADERS,
} from "./tasks.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteTasksByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteTasksByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteTasksByIds(["task-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }),
      makeTaskRow({ id: "task-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteTasksByIds(["task-1", "task-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }),
      makeTaskRow({ id: "task-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(["task-1", "task-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-keep" }),
      makeTaskRow({ id: "task-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(["task-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }), // row 2
      makeTaskRow({ id: "task-2" }), // row 3
      makeTaskRow({ id: "task-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(["task-1", "task-2", "task-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    // Header at index 0, task at index 1 → sheet row 2
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteTasksByIds(["task-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new task", () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newTask: Task = {
      id: "task-new",
      name: "Buy groceries",
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
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertTasks([newTask]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
