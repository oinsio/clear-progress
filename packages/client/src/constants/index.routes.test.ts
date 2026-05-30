import { describe, expect, it } from "vitest";
import { ROUTES } from "./index";

describe("ROUTES", () => {
  it("should have non-empty string values", () => {
    for (const value of Object.values(ROUTES)) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });

  it("should define INBOX as /inbox", () => {
    expect(ROUTES.INBOX).toBe("/inbox");
  });

  it("should define TASKS as /tasks", () => {
    expect(ROUTES.TASKS).toBe("/tasks");
  });

  it("should define COMPLETED as /completed", () => {
    expect(ROUTES.COMPLETED).toBe("/completed");
  });

  it("should define GOALS as /goals", () => {
    expect(ROUTES.GOALS).toBe("/goals");
  });

  it("should define SETTINGS as /settings", () => {
    expect(ROUTES.SETTINGS).toBe("/settings");
  });
});
