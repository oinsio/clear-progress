import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { upsertSettings } from "./settings.sheet";
import {
  COL,
  makeSetting,
  makeSettingRow,
  makeSheetMock,
  NUM_COLS,
  SET_HEADERS,
} from "./settings.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("upsertSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not call getSheet when settings array is empty", () => {
    upsertSettings([]);

    expect(getSheet).not.toHaveBeenCalled();
  });

  it("should call getSheet with Settings sheet name when array is not empty", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([SET_HEADERS]) as never);

    upsertSettings([makeSetting()]);

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.SETTINGS);
  });

  it("should call appendRow once for a single new setting", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "new_key" })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it("should call appendRow for each new setting", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([
      makeSetting({ key: "key1" }),
      makeSetting({ key: "key2" }),
    ]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(2);
  });

  it("should not call setValues when all settings are new", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "new_key" })]);

    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });

  it("should call setValues when updating an existing setting", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "default_box", value: "today" })]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it("should not call appendRow when all settings already exist", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "default_box", value: "today" })]);

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it("should write updated value for existing setting", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box", value: "inbox" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "default_box", value: "today" })]);

    const writtenData = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenData[1][COL.value]).toBe("today");
  });

  it("should preserve all rows in the batch including header row", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box", value: "inbox" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "default_box", value: "today" })]);

    const writtenData = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenData[0]).toEqual(SET_HEADERS);
  });

  it("should call getRange with full range including header", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "default_box" })]);

    expect(sheetMock.getRange).toHaveBeenCalledWith(1, 1, 2, NUM_COLS);
  });

  it("should update existing and append new in the same call", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([
      makeSetting({ key: "default_box", value: "today" }),
      makeSetting({ key: "accent_color", value: "blue" }),
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it("should write all updated rows in a single setValues call", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box", value: "inbox" }),
      makeSettingRow({ key: "accent_color", value: "green" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([
      makeSetting({ key: "default_box", value: "today" }),
      makeSetting({ key: "accent_color", value: "blue" }),
    ]);

    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
    const writtenData = sheetMock._setValues.mock.calls[0][0] as unknown[][];
    expect(writtenData[1][COL.value]).toBe("today");
    expect(writtenData[2][COL.value]).toBe("blue");
  });

  it("should not treat empty-key rows as existing settings", () => {
    const emptyKeyRow = SET_HEADERS.map(() => "");
    const sheetMock = makeSheetMock([SET_HEADERS, emptyKeyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "default_box" })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });

  it("should append a setting with empty key even when sheet has an empty-key row", () => {
    const emptyKeyRow = SET_HEADERS.map(() => "");
    const sheetMock = makeSheetMock([SET_HEADERS, emptyKeyRow]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([makeSetting({ key: "" })]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).not.toHaveBeenCalled();
  });

  it("should append row with correct setting data", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSettings([
      makeSetting({
        key: "accent_color",
        value: "blue",
        updated_at: "2025-05-01T00:00:00.000Z",
      }),
    ]);

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.key]).toBe("accent_color");
    expect(appendedRow[COL.value]).toBe("blue");
    expect(appendedRow[COL.updated_at]).toBe("2025-05-01T00:00:00.000Z");
  });
});
