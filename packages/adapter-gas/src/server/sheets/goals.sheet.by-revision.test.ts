import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getGoalsByRevision } from "./goals.sheet";
import {
  GOAL_HEADERS,
  makeGoalRow,
  makeSheetMock,
} from "./goals.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getGoalsByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return goals with revision strictly greater than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", revision: 3 }),
        makeGoalRow({ id: "goal-2", revision: 5 }),
      ]) as never,
    );

    const goals = getGoalsByRevision(2);
    expect(goals.map((g) => g.id)).toEqual(["goal-1", "goal-2"]);
  });

  it("should not return goals with revision equal to minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ revision: 5 })]) as never,
    );

    expect(getGoalsByRevision(5)).toHaveLength(0);
  });

  it("should not return goals with revision less than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ revision: 3 })]) as never,
    );

    expect(getGoalsByRevision(5)).toHaveLength(0);
  });

  it("should return all goals when minRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", revision: 1 }),
        makeGoalRow({ id: "goal-2", revision: 2 }),
      ]) as never,
    );

    expect(getGoalsByRevision(0)).toHaveLength(2);
  });

  it("should return legacy goals with revision=0 when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-legacy", revision: 0 }),
        makeGoalRow({ id: "goal-revised", revision: 3 }),
      ]) as never,
    );

    expect(getGoalsByRevision(0)).toHaveLength(2);
  });

  it("should return legacy goals with revision=0 even when sinceRevision is greater than 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-legacy", revision: 0 }),
        makeGoalRow({ id: "goal-old", revision: 2 }),
      ]) as never,
    );

    const goals = getGoalsByRevision(5);
    expect(goals.map((g) => g.id)).toEqual(["goal-legacy"]);
  });

  it("should return empty array when no goals match", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ revision: 1 })]) as never,
    );

    expect(getGoalsByRevision(10)).toEqual([]);
  });
});
