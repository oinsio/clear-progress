import { describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { getAllTasks } from "./tasks.sheet";
import {
  makeSheetMock,
  makeTaskRow,
  TASK_HEADERS,
} from "./tasks.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllTasks", () => {
  it("should return empty array when sheet has only a header row", () => {
    const sheetMock = makeSheetMock([TASK_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toEqual([]);
  });

  it("should return empty array when sheet has no rows at all", () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = TASK_HEADERS.map(() => "");
    const sheetMock = makeSheetMock([TASK_HEADERS, emptyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toEqual([]);
  });

  it("should return one task when sheet has one data row", () => {
    const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow()]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toHaveLength(1);
  });

  it("should return multiple tasks", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ id: "task-1" }),
      makeTaskRow({ id: "task-2" }),
      makeTaskRow({ id: "task-3" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()).toHaveLength(3);
  });

  it("should correctly map all string fields from row", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({
        id: "task-abc",
        name: "My name",
        description: "Some description",
        goal_id: "goal-1",
        context_id: "ctx-1",
        category_id: "cat-1",
        completed_at: "2025-06-01T00:00:00.000Z",
        repeat_rule: "FREQ=DAILY",
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-03-01T00:00:00.000Z",
      }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const [task] = getAllTasks();
    expect(task.id).toBe("task-abc");
    expect(task.name).toBe("My name");
    expect(task.description).toBe("Some description");
    expect(task.goal_id).toBe("goal-1");
    expect(task.context_id).toBe("ctx-1");
    expect(task.category_id).toBe("cat-1");
    expect(task.completed_at).toBe("2025-06-01T00:00:00.000Z");
    expect(task.repeat_rule).toBe("FREQ=DAILY");
    expect(task.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(task.updated_at).toBe("2025-03-01T00:00:00.000Z");
  });

  it("should map numeric field sort_order", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ sort_order: 5 }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const [task] = getAllTasks();
    expect(task.sort_order).toBe(5);
  });

  it("should coerce boolean true for is_completed", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ is_completed: true }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_completed).toBe(true);
  });

  it('should coerce string "TRUE" for is_completed', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ is_completed: "TRUE" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_completed).toBe(true);
  });

  it("should coerce false for is_completed when value is not TRUE", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ is_completed: "false" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_completed).toBe(false);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ is_deleted: "TRUE" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].is_deleted).toBe(true);
  });

  it('should default box to "inbox" for invalid box value', () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({ box: "invalid_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(getAllTasks()[0].box).toBe("inbox");
  });

  it("should accept valid box values", () => {
    for (const box of ["inbox", "today", "week", "later"]) {
      const sheetMock = makeSheetMock([TASK_HEADERS, makeTaskRow({ box })]);
      vi.mocked(getSheet).mockReturnValue(sheetMock as never);

      expect(getAllTasks()[0].box).toBe(box);
    }
  });

  it("should coerce null row values to empty string for string fields", () => {
    const sheetMock = makeSheetMock([
      TASK_HEADERS,
      makeTaskRow({
        name: null,
        description: null,
        goal_id: null,
        context_id: null,
        category_id: null,
        completed_at: null,
        repeat_rule: null,
        created_at: null,
        updated_at: null,
      }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const [task] = getAllTasks();
    expect(task.name).toBe("");
    expect(task.description).toBe("");
    expect(task.goal_id).toBe("");
    expect(task.context_id).toBe("");
    expect(task.category_id).toBe("");
    expect(task.completed_at).toBe("");
    expect(task.repeat_rule).toBe("");
    expect(task.created_at).toBe("");
    expect(task.updated_at).toBe("");
  });

  it("should call getSheet with Tasks sheet name", () => {
    const sheetMock = makeSheetMock([]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    getAllTasks();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.TASKS);
  });
});
