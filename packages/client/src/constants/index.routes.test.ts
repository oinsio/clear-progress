import { describe, expect, it } from "vitest";
import { ROUTES } from "./index";

describe("ROUTES", () => {
  it("should have non-empty string values", () => {
    for (const value of Object.values(ROUTES)) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });

  it("should define INBOX as /tasks", () => {
    expect(ROUTES.INBOX).toBe("/tasks");
  });

  it("should define TODAY as /today", () => {
    expect(ROUTES.TODAY).toBe("/today");
  });

  it("should define WEEK as /week", () => {
    expect(ROUTES.WEEK).toBe("/week");
  });

  it("should define LATER as /later", () => {
    expect(ROUTES.LATER).toBe("/later");
  });

  it("should define GOALS as /goals", () => {
    expect(ROUTES.GOALS).toBe("/goals");
  });

  it("should define SETTINGS as /settings", () => {
    expect(ROUTES.SETTINGS).toBe("/settings");
  });
});
