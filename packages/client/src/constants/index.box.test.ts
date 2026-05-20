import { describe, expect, it } from "vitest";
import {
  BOX,
  BOX_FILTER_ALL,
  BOX_FILTER_LABELS,
  BOX_ORDER,
  TASK_BOX_FILTER_ORDER,
} from "./index";

describe("BOX", () => {
  it("should define INBOX as 'inbox'", () => {
    expect(BOX.INBOX).toBe("inbox");
  });

  it("should define TODAY as 'today'", () => {
    expect(BOX.TODAY).toBe("today");
  });

  it("should define WEEK as 'week'", () => {
    expect(BOX.WEEK).toBe("week");
  });

  it("should define LATER as 'later'", () => {
    expect(BOX.LATER).toBe("later");
  });

  it("should have 4 box values", () => {
    expect(Object.keys(BOX)).toHaveLength(4);
  });
});

describe("BOX_ORDER", () => {
  it("should be an array with 4 elements", () => {
    expect(BOX_ORDER).toHaveLength(4);
  });

  it("should contain all box values", () => {
    expect(BOX_ORDER).toContain("inbox");
    expect(BOX_ORDER).toContain("today");
    expect(BOX_ORDER).toContain("week");
    expect(BOX_ORDER).toContain("later");
  });
});

describe("BOX_FILTER_ALL", () => {
  it("should be 'all'", () => {
    expect(BOX_FILTER_ALL).toBe("all");
  });
});

describe("BOX_FILTER_LABELS", () => {
  it("should have a label for each box filter", () => {
    expect(BOX_FILTER_LABELS.all).toBeTruthy();
    expect(BOX_FILTER_LABELS.inbox).toBeTruthy();
    expect(BOX_FILTER_LABELS.today).toBeTruthy();
    expect(BOX_FILTER_LABELS.week).toBeTruthy();
    expect(BOX_FILTER_LABELS.later).toBeTruthy();
  });
});

describe("TASK_BOX_FILTER_ORDER", () => {
  it("should be an array with 4 elements", () => {
    expect(TASK_BOX_FILTER_ORDER).toHaveLength(4);
  });

  it("should contain 'all' filter", () => {
    expect(TASK_BOX_FILTER_ORDER).toContain("all");
  });

  it("should start with 'today'", () => {
    expect(TASK_BOX_FILTER_ORDER[0]).toBe("today");
  });

  it("should have 'week' as second element", () => {
    expect(TASK_BOX_FILTER_ORDER[1]).toBe("week");
  });

  it("should have 'later' as third element", () => {
    expect(TASK_BOX_FILTER_ORDER[2]).toBe("later");
  });

  it("should end with 'all'", () => {
    expect(TASK_BOX_FILTER_ORDER[3]).toBe("all");
  });
});
