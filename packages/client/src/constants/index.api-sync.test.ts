import { describe, expect, it } from "vitest";
import { API_ACTIONS, SYNC_DEBOUNCE_MS, SYNC_INTERVAL_MS } from "./index";

describe("API_ACTIONS", () => {
  it("should define PING as 'ping'", () => {
    expect(API_ACTIONS.PING).toBe("ping");
  });

  it("should define INIT as 'init'", () => {
    expect(API_ACTIONS.INIT).toBe("init");
  });

  it("should define PULL as 'pull'", () => {
    expect(API_ACTIONS.PULL).toBe("pull");
  });

  it("should define PUSH as 'push'", () => {
    expect(API_ACTIONS.PUSH).toBe("push");
  });

  it("should have non-empty string values", () => {
    for (const value of Object.values(API_ACTIONS)) {
      expect(value).toBeTruthy();
    }
  });
});

describe("SYNC_INTERVAL_MS", () => {
  it("should be 5 minutes in milliseconds", () => {
    expect(SYNC_INTERVAL_MS).toBe(5 * 60 * 1000);
  });

  it("should be a positive number", () => {
    expect(SYNC_INTERVAL_MS).toBeGreaterThan(0);
  });
});

describe("SYNC_DEBOUNCE_MS", () => {
  it("should be 7500 milliseconds", () => {
    expect(SYNC_DEBOUNCE_MS).toBe(15000);
  });

  it("should be a positive number", () => {
    expect(SYNC_DEBOUNCE_MS).toBeGreaterThan(0);
  });
});
