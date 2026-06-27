import { describe, expect, it } from "vitest";
import {
  DESKTOP_FILTER_BAR_POSITION,
  DESKTOP_PANEL_SIDE,
  MAX_COVER_SIZE_BYTES,
  MOBILE_FILTER_BAR_POSITION,
  MOBILE_PANEL_SIDE,
  PANEL_SIDES,
  PUSH_RESULT_STATUS,
} from "./index";

describe("MAX_COVER_SIZE_BYTES", () => {
  it("should be 2MB in bytes", () => {
    expect(MAX_COVER_SIZE_BYTES).toBe(2 * 1024 * 1024);
  });
});

describe("PUSH_RESULT_STATUS", () => {
  it("should define CREATED status", () => {
    expect(PUSH_RESULT_STATUS.CREATED).toBe("created");
  });

  it("should define ACCEPTED status", () => {
    expect(PUSH_RESULT_STATUS.ACCEPTED).toBe("accepted");
  });

  it("should define CONFLICT status", () => {
    expect(PUSH_RESULT_STATUS.CONFLICT).toBe("conflict");
  });

  it("should define REJECTED status", () => {
    expect(PUSH_RESULT_STATUS.REJECTED).toBe("rejected");
  });
});

// implements FR7 of improve-sidebar-ux
describe("platform-aware panel side constants", () => {
  it("should default to 'left' on desktop", () => {
    expect(DESKTOP_PANEL_SIDE).toBe("left");
  });

  it("should default to 'right' on mobile", () => {
    expect(MOBILE_PANEL_SIDE).toBe("right");
  });
});

describe("PANEL_SIDES", () => {
  it("should contain both 'left' and 'right'", () => {
    expect(PANEL_SIDES).toContain("left");
    expect(PANEL_SIDES).toContain("right");
  });

  it("should have exactly 2 sides", () => {
    expect(PANEL_SIDES).toHaveLength(2);
  });
});

// implements FR7 of improve-sidebar-ux
describe("platform-aware filter bar position constants", () => {
  it("should default to 'top' on desktop", () => {
    expect(DESKTOP_FILTER_BAR_POSITION).toBe("top");
  });

  it("should default to 'bottom' on mobile", () => {
    expect(MOBILE_FILTER_BAR_POSITION).toBe("bottom");
  });
});
