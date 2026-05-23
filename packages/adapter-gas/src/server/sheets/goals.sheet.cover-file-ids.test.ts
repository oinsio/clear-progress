import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getCoverHashes } from "./goals.sheet";
import {
  GOAL_HEADERS,
  makeGoalRow,
  makeSheetMock,
} from "./goals.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getCoverHashes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when no goals have cover_hash", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ cover_hash: "" })]) as never,
    );

    expect(getCoverHashes()).toEqual([]);
  });

  it("should return cover_hash values of goals that have one", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_hash: "hash-abc" }),
        makeGoalRow({ id: "goal-2", cover_hash: "hash-xyz" }),
      ]) as never,
    );

    expect(getCoverHashes()).toEqual(["hash-abc", "hash-xyz"]);
  });

  it("should filter out goals without cover_hash", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_hash: "hash-abc" }),
        makeGoalRow({ id: "goal-2", cover_hash: "" }),
      ]) as never,
    );

    expect(getCoverHashes()).toEqual(["hash-abc"]);
  });

  it("should return duplicate hashes when multiple goals share the same cover", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_hash: "hash-shared" }),
        makeGoalRow({ id: "goal-2", cover_hash: "hash-shared" }),
      ]) as never,
    );

    expect(getCoverHashes()).toEqual(["hash-shared", "hash-shared"]);
  });

  it("should return empty array when sheet has no goals", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([GOAL_HEADERS]) as never);

    expect(getCoverHashes()).toEqual([]);
  });

  it("should exclude goals with null cover_hash cell value", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([GOAL_HEADERS, makeGoalRow({ cover_hash: null })]) as never,
    );

    expect(getCoverHashes()).toEqual([]);
  });

  it("should return only non-empty cover_hashes when mixing null and valid values", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        GOAL_HEADERS,
        makeGoalRow({ id: "goal-1", cover_hash: "hash-123" }),
        makeGoalRow({ id: "goal-2", cover_hash: null }),
      ]) as never,
    );

    expect(getCoverHashes()).toEqual(["hash-123"]);
  });
});
