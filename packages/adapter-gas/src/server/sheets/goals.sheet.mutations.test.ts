import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal } from "../types";
import { getSheet } from "./client";
import { deleteGoalsByIds, upsertGoals } from "./goals.sheet";
import {
  GOAL_HEADERS,
  makeGoalRow,
  makeSheetMock,
} from "./goals.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteGoalsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteGoalsByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteGoalsByIds(["goal-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-1" }),
      makeGoalRow({ id: "goal-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteGoalsByIds(["goal-1", "goal-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-1" }),
      makeGoalRow({ id: "goal-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(["goal-1", "goal-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-keep" }),
      makeGoalRow({ id: "goal-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(["goal-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-1" }), // row 2
      makeGoalRow({ id: "goal-2" }), // row 3
      makeGoalRow({ id: "goal-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(["goal-1", "goal-2", "goal-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    // Header at index 0, goal at index 1 → sheet row 2
    const sheetMock = makeSheetMock([
      GOAL_HEADERS,
      makeGoalRow({ id: "goal-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteGoalsByIds(["goal-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new goal", () => {
    const sheetMock = makeSheetMock([GOAL_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newGoal: Goal = {
      id: "goal-new",
      name: "Learn TypeScript",
      description: "",
      cover_file_id: "",
      status: "planning",
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertGoals([newGoal]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
