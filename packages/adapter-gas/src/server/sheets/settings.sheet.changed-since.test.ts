import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getSettingsChangedSince } from "./settings.sheet";
import {
  makeSettingRow,
  makeSheetMock,
  SET_HEADERS,
} from "./settings.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getSettingsChangedSince", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all settings when since is empty string", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({
          key: "default_box",
          updated_at: "2025-01-01T00:00:00.000Z",
        }),
        makeSettingRow({
          key: "accent_color",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const result = getSettingsChangedSince("");

    expect(result).toHaveLength(2);
  });

  it("should return only settings with updated_at greater than since", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({
          key: "default_box",
          updated_at: "2026-04-10T00:00:00.000Z",
        }),
        makeSettingRow({
          key: "accent_color",
          updated_at: "2026-04-16T00:00:00.000Z",
        }),
      ]) as never,
    );

    const result = getSettingsChangedSince("2026-04-15T10:00:00.000Z");

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("accent_color");
  });

  it("should return empty array when since is in the future", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({
          key: "default_box",
          updated_at: "2025-01-01T00:00:00.000Z",
        }),
        makeSettingRow({
          key: "accent_color",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const result = getSettingsChangedSince("9999-12-31T23:59:59.999Z");

    expect(result).toEqual([]);
  });

  it("should not include settings with updated_at equal to since", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({
          key: "default_box",
          updated_at: "2026-04-15T10:00:00.000Z",
        }),
        makeSettingRow({
          key: "accent_color",
          updated_at: "2026-04-15T10:00:00.001Z",
        }),
      ]) as never,
    );

    const result = getSettingsChangedSince("2026-04-15T10:00:00.000Z");

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("accent_color");
  });

  it("should return empty array when sheet has only header", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS]) as never);

    const result = getSettingsChangedSince("2026-04-15T10:00:00.000Z");

    expect(result).toEqual([]);
  });

  it("should filter correctly with multiple settings at different times", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({
          key: "setting1",
          updated_at: "2026-04-10T00:00:00.000Z",
        }),
        makeSettingRow({
          key: "setting2",
          updated_at: "2026-04-14T00:00:00.000Z",
        }),
        makeSettingRow({
          key: "setting3",
          updated_at: "2026-04-16T00:00:00.000Z",
        }),
        makeSettingRow({
          key: "setting4",
          updated_at: "2026-04-17T00:00:00.000Z",
        }),
      ]) as never,
    );

    const result = getSettingsChangedSince("2026-04-15T00:00:00.000Z");

    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("setting3");
    expect(result[1].key).toBe("setting4");
  });
});
