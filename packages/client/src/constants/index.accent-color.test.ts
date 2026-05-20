import { describe, expect, it } from "vitest";
import {
  ACCENT_COLOR_VALUES,
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
} from "./index";

describe("DEFAULT_ACCENT_COLOR", () => {
  it("should be 'green'", () => {
    expect(DEFAULT_ACCENT_COLOR).toBe("green");
  });

  it("should be included in ACCENT_COLORS list", () => {
    expect(ACCENT_COLORS).toContain(DEFAULT_ACCENT_COLOR);
  });
});

describe("ACCENT_COLORS", () => {
  it("should have 8 colors", () => {
    expect(ACCENT_COLORS).toHaveLength(8);
  });

  it("should contain standard accent colors", () => {
    expect(ACCENT_COLORS).toContain("coral");
    expect(ACCENT_COLORS).toContain("orange");
    expect(ACCENT_COLORS).toContain("yellow");
    expect(ACCENT_COLORS).toContain("green");
    expect(ACCENT_COLORS).toContain("blue");
    expect(ACCENT_COLORS).toContain("indigo");
    expect(ACCENT_COLORS).toContain("purple");
  });
});

describe("ACCENT_COLOR_VALUES", () => {
  it("should have a hex value for each accent color", () => {
    for (const color of ACCENT_COLORS) {
      expect(ACCENT_COLOR_VALUES[color]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("should have the correct value for green", () => {
    expect(ACCENT_COLOR_VALUES.green).toBe("#69b23e");
  });
});
