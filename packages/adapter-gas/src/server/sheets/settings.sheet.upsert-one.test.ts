import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { upsertSetting } from "./settings.sheet";
import {
  COL,
  makeSetting,
  makeSettingRow,
  makeSheetMock,
  NUM_COLS,
  SET_HEADERS,
} from "./settings.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("upsertSetting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when key is not found in sheet", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "new_key" }));

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });

  it("should not call getRange when inserting a new setting", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "new_key" }));

    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it("should append row with setting data in correct column order", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(
      makeSetting({
        key: "accent_color",
        value: "orange",
        updated_at: "2025-03-01T00:00:00.000Z",
      }),
    );

    const appendedRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(appendedRow[COL.key]).toBe("accent_color");
    expect(appendedRow[COL.value]).toBe("orange");
    expect(appendedRow[COL.updated_at]).toBe("2025-03-01T00:00:00.000Z");
  });

  it("should call getRange and setValues when key already exists", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "default_box", value: "today" }));

    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock._setValues).toHaveBeenCalledTimes(1);
  });

  it("should not call appendRow when updating an existing setting", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "default_box", value: "today" }));

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });

  it("should update the correct 1-based row index", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "default_box" }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });

  it("should update the correct row when target is the second setting", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
      makeSettingRow({ key: "accent_color" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "accent_color" }));

    expect(sheetMock.getRange).toHaveBeenCalledWith(3, 1, 1, NUM_COLS);
  });

  it("should write updated value when updating existing setting", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box", value: "inbox" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "default_box", value: "today" }));

    const writtenRow = sheetMock._setValues.mock.calls[0][0][0] as unknown[];
    expect(writtenRow[COL.value]).toBe("today");
  });

  it("should match by key column, not by id", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: "default_box" }),
      makeSettingRow({ key: "accent_color" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    upsertSetting(makeSetting({ key: "default_box", value: "week" }));

    // Should update row 2 (default_box), not row 3 (accent_color)
    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, NUM_COLS);
  });
});
