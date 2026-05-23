import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { getAllGoals } from "./goals.sheet";
import {
  GOAL_HEADERS,
  makeGoalRow,
  makeSheetMock,
} from "./goals.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS]) as never);

    expect(getAllGoals()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllGoals()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = GOAL_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, emptyRow]) as never,
    );

    expect(getAllGoals()).toEqual([]);
  });

  it("should return one goal when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow()]) as never,
    );

    expect(getAllGoals()).toHaveLength(1);
  });

  it("should return multiple goals", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1" }),
        makeGoalRow({ id: "goal-2" }),
        makeGoalRow({ id: "goal-3" }),
      ]) as never,
    );

    expect(getAllGoals()).toHaveLength(3);
  });

  it("should correctly map string fields from row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({
          id: "goal-abc",
          name: "My goal",
          description: "Some description",
          cover_hash: "drive-file-hash",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-03-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [goal] = getAllGoals();
    expect(goal.id).toBe("goal-abc");
    expect(goal.name).toBe("My goal");
    expect(goal.description).toBe("Some description");
    expect(goal.cover_hash).toBe("drive-file-hash");
    expect(goal.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(goal.updated_at).toBe("2025-03-01T00:00:00.000Z");
  });

  it("should coerce null row values to empty string for string fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({
          name: null,
          description: null,
          cover_hash: null,
          created_at: null,
          updated_at: null,
        }),
      ]) as never,
    );

    const [goal] = getAllGoals();
    expect(goal.name).toBe("");
    expect(goal.description).toBe("");
    expect(goal.cover_hash).toBe("");
    expect(goal.created_at).toBe("");
    expect(goal.updated_at).toBe("");
  });

  it("should map numeric field sort_order", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ sort_order: 3 })]) as never,
    );

    const [goal] = getAllGoals();
    expect(goal.sort_order).toBe(3);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ is_deleted: "TRUE" }),
      ]) as never,
    );

    expect(getAllGoals()[0].is_deleted).toBe(true);
  });

  it("should coerce boolean true for is_deleted", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ is_deleted: true })]) as never,
    );

    expect(getAllGoals()[0].is_deleted).toBe(true);
  });

  it("should coerce false for is_deleted when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ is_deleted: "false" }),
      ]) as never,
    );

    expect(getAllGoals()[0].is_deleted).toBe(false);
  });

  it('should default status to "planning" for invalid status value', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ status: "invalid_status" }),
      ]) as never,
    );

    expect(getAllGoals()[0].status).toBe("planning");
  });

  it("should accept all valid goal status values", () => {
    for (const status of [
      "planning",
      "in_progress",
      "paused",
      "completed",
      "cancelled",
    ]) {
      vi.mocked(getSheet).mockReturnValue(
        makeSheetMock([GOAL_HEADERS, makeGoalRow({ status })]) as never,
      );

      expect(getAllGoals()[0].status).toBe(status);
    }
  });

  it("should call getSheet with Goals sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllGoals();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.GOALS);
  });
});
