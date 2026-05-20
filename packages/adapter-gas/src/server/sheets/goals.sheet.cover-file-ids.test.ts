import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getCoverFileIds } from "./goals.sheet";
import {
  GOAL_HEADERS,
  makeGoalRow,
  makeSheetMock,
} from "./goals.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getCoverFileIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when no goals have cover_file_id", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ cover_file_id: "" }),
      ]) as never,
    );

    expect(getCoverFileIds()).toEqual([]);
  });

  it("should return cover_file_id values of goals that have one", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_file_id: "file-abc" }),
        makeGoalRow({ id: "goal-2", cover_file_id: "file-xyz" }),
      ]) as never,
    );

    expect(getCoverFileIds()).toEqual(["file-abc", "file-xyz"]);
  });

  it("should filter out goals without cover_file_id", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_file_id: "file-abc" }),
        makeGoalRow({ id: "goal-2", cover_file_id: "" }),
      ]) as never,
    );

    expect(getCoverFileIds()).toEqual(["file-abc"]);
  });

  it("should return duplicate file ids when multiple goals share the same cover", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_file_id: "file-shared" }),
        makeGoalRow({ id: "goal-2", cover_file_id: "file-shared" }),
      ]) as never,
    );

    expect(getCoverFileIds()).toEqual(["file-shared", "file-shared"]);
  });

  it("should return empty array when sheet has no goals", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS]) as never);

    expect(getCoverFileIds()).toEqual([]);
  });

  it("should exclude goals with null cover_file_id cell value", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ cover_file_id: null }),
      ]) as never,
    );

    expect(getCoverFileIds()).toEqual([]);
  });

  it("should return only non-empty cover_file_ids when mixing null and valid values", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_file_id: "file-123" }),
        makeGoalRow({ id: "goal-2", cover_file_id: null }),
      ]) as never,
    );

    expect(getCoverFileIds()).toEqual(["file-123"]);
  });
});
