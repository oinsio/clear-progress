import { describe, expect, it } from "vitest";
import type { GoalStatus } from "@/types/common";
import {
  DEFAULT_GOAL_FILTER,
  GOAL_FILTER_EMPTY_MESSAGE_KEYS,
  GOAL_FILTER_OPTIONS,
  GOAL_FILTER_STATUS_MAP,
} from "./index";

describe("GOAL_FILTER_OPTIONS", () => {
  it("should have exactly 4 values", () => {
    expect(GOAL_FILTER_OPTIONS).toHaveLength(4);
  });

  it("should contain all filter options", () => {
    expect(GOAL_FILTER_OPTIONS).toContain("active");
    expect(GOAL_FILTER_OPTIONS).toContain("paused");
    expect(GOAL_FILTER_OPTIONS).toContain("finished");
    expect(GOAL_FILTER_OPTIONS).toContain("all");
  });
});

describe("DEFAULT_GOAL_FILTER", () => {
  it("should be 'all'", () => {
    expect(DEFAULT_GOAL_FILTER).toBe("all");
  });
});

describe("GOAL_FILTER_STATUS_MAP", () => {
  const ALL_GOAL_STATUSES: GoalStatus[] = [
    "planning",
    "in_progress",
    "paused",
    "completed",
    "cancelled",
  ];

  it("should cover all 5 GoalStatus values across its entries", () => {
    const coveredStatuses = new Set(
      Object.values(GOAL_FILTER_STATUS_MAP).flat(),
    );
    for (const status of ALL_GOAL_STATUSES) {
      expect(coveredStatuses.has(status)).toBe(true);
    }
  });

  it("should map 'active' to planning and in_progress", () => {
    expect(GOAL_FILTER_STATUS_MAP.active).toEqual(["planning", "in_progress"]);
  });

  it("should map 'paused' to paused", () => {
    expect(GOAL_FILTER_STATUS_MAP.paused).toEqual(["paused"]);
  });

  it("should map 'finished' to completed and cancelled", () => {
    expect(GOAL_FILTER_STATUS_MAP.finished).toEqual(["completed", "cancelled"]);
  });

  it("should map 'all' to all 5 statuses", () => {
    expect(GOAL_FILTER_STATUS_MAP.all).toHaveLength(5);
  });
});

describe("GOAL_FILTER_EMPTY_MESSAGE_KEYS", () => {
  it("should have an entry for each GoalFilter value", () => {
    expect(GOAL_FILTER_EMPTY_MESSAGE_KEYS.active).toBe("goal.emptyActive");
    expect(GOAL_FILTER_EMPTY_MESSAGE_KEYS.paused).toBe("goal.emptyPaused");
    expect(GOAL_FILTER_EMPTY_MESSAGE_KEYS.finished).toBe("goal.emptyFinished");
    expect(GOAL_FILTER_EMPTY_MESSAGE_KEYS.all).toBe("goal.empty");
  });
});
