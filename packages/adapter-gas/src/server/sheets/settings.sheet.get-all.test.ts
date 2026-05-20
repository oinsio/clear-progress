import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { getAllSettings } from "./settings.sheet";
import {
  makeSettingRow,
  makeSheetMock,
  SET_HEADERS,
} from "./settings.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS]) as never);

    expect(getAllSettings()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllSettings()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = SET_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([SET_HEADERS, emptyRow]) as never,
    );

    expect(getAllSettings()).toEqual([]);
  });

  it("should return one setting when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([SET_HEADERS, makeSettingRow()]) as never,
    );

    expect(getAllSettings()).toHaveLength(1);
  });

  it("should return multiple settings", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({ key: "default_box", value: "inbox" }),
        makeSettingRow({ key: "accent_color", value: "green" }),
      ]) as never,
    );

    expect(getAllSettings()).toHaveLength(2);
  });

  it("should correctly map key, value and updated_at fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({
          key: "accent_color",
          value: "purple",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [setting] = getAllSettings();
    expect(setting.key).toBe("accent_color");
    expect(setting.value).toBe("purple");
    expect(setting.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("should return empty string for value when cell is empty", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({ key: "some_key", value: "" }),
      ]) as never,
    );

    expect(getAllSettings()[0].value).toBe("");
  });

  it("should call getSheet with Settings sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllSettings();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.SETTINGS);
  });

  it("should return empty string for value when cell is null", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({ key: "some_key", value: null }),
      ]) as never,
    );

    expect(getAllSettings()[0].value).toBe("");
  });

  it("should return empty string for updated_at when cell is null", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        SET_HEADERS,
        makeSettingRow({ key: "some_key", updated_at: null }),
      ]) as never,
    );

    expect(getAllSettings()[0].updated_at).toBe("");
  });
});
