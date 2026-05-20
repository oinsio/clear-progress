import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../helpers/constants";
import { getSheet } from "./client";
import { initDefaults } from "./settings.sheet";
import {
  COL,
  makeSettingRow,
  makeSheetMock,
  SET_HEADERS,
} from "./settings.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("initDefaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should insert both defaults when sheet is empty", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(2);
  });

  it("should insert default_box when it is missing", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    const appendedKeys = sheetMock.appendRow.mock.calls.map(
      (call) => (call[0] as unknown[])[COL.key],
    );
    expect(appendedKeys).toContain(DEFAULT_SETTINGS.DEFAULT_BOX.key);
  });

  it("should insert accent_color when it is missing", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    const appendedKeys = sheetMock.appendRow.mock.calls.map(
      (call) => (call[0] as unknown[])[COL.key],
    );
    expect(appendedKeys).toContain(DEFAULT_SETTINGS.ACCENT_COLOR.key);
  });

  it("should not insert default_box when it already exists", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: DEFAULT_SETTINGS.DEFAULT_BOX.key }),
      makeSettingRow({ key: DEFAULT_SETTINGS.ACCENT_COLOR.key }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    expect(sheetMock.appendRow).not.toHaveBeenCalled();
    expect(sheetMock.getRange).not.toHaveBeenCalled();
  });

  it("should only insert missing default when one already exists", () => {
    const sheetMock = makeSheetMock([
      SET_HEADERS,
      makeSettingRow({ key: DEFAULT_SETTINGS.DEFAULT_BOX.key }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
    const appendedKey = (sheetMock.appendRow.mock.calls[0][0] as unknown[])[
      COL.key
    ];
    expect(appendedKey).toBe(DEFAULT_SETTINGS.ACCENT_COLOR.key);
  });

  it("should insert default_box with its default value", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    // DEFAULTS inserts in order: default_box first, accent_color second
    const firstRow = sheetMock.appendRow.mock.calls[0][0] as unknown[];
    expect(firstRow[COL.key]).toBe(DEFAULT_SETTINGS.DEFAULT_BOX.key);
    expect(firstRow[COL.value]).toBe(DEFAULT_SETTINGS.DEFAULT_BOX.value);
  });

  it("should insert accent_color with its default value", () => {
    const sheetMock = makeSheetMock([SET_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    initDefaults();

    const secondRow = sheetMock.appendRow.mock.calls[1][0] as unknown[];
    expect(secondRow[COL.key]).toBe(DEFAULT_SETTINGS.ACCENT_COLOR.key);
    expect(secondRow[COL.value]).toBe(DEFAULT_SETTINGS.ACCENT_COLOR.value);
  });
});
