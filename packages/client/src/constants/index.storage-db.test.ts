import { describe, expect, it } from "vitest";
import { DB_NAME, SETTING_KEYS, STORAGE_KEYS } from "./index";

describe("DB_NAME", () => {
  it("should be 'clear-progress'", () => {
    expect(DB_NAME).toBe("clear-progress");
  });
});

describe("STORAGE_KEYS", () => {
  it("should have non-empty string values", () => {
    for (const value of Object.values(STORAGE_KEYS)) {
      expect(value).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });

  it("should define LAST_SYNC key", () => {
    expect(STORAGE_KEYS.LAST_SYNC).toBe("last_sync");
  });

  it("should define ACCENT_COLOR key", () => {
    expect(STORAGE_KEYS.ACCENT_COLOR).toBe("accent_color");
  });

  it("should define DEFAULT_BOX key", () => {
    expect(STORAGE_KEYS.DEFAULT_BOX).toBe("default_box");
  });
});

describe("SETTING_KEYS", () => {
  it("should define DEFAULT_BOX key", () => {
    expect(SETTING_KEYS.DEFAULT_BOX).toBe("default_box");
  });

  it("should define ACCENT_COLOR key", () => {
    expect(SETTING_KEYS.ACCENT_COLOR).toBe("accent_color");
  });
});
