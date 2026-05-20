import { vi } from "vitest";
import { SHEET_HEADERS, SHEET_NAMES } from "../helpers/constants";
import type { Setting } from "../types";

export const SET_HEADERS = SHEET_HEADERS[SHEET_NAMES.SETTINGS];
export const NUM_COLS = SET_HEADERS.length;

export const COL = SET_HEADERS.reduce<Record<string, number>>((acc, col, i) => {
  acc[col] = i;
  return acc;
}, {});

export function makeSettingRow(
  overrides: Partial<Record<string, unknown>> = {},
): unknown[] {
  const defaults: Record<string, unknown> = {
    key: "default_box",
    value: "inbox",
    updated_at: "2025-01-01T00:00:00.000Z",
  };
  const merged = { ...defaults, ...overrides };
  return SET_HEADERS.map((col) => merged[col]);
}

export function makeSetting(overrides: Partial<Setting> = {}): Setting {
  return {
    key: "default_box",
    value: "inbox",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeSheetMock(
  rows: unknown[][] = [],
): Record<string, ReturnType<typeof vi.fn>> {
  const setValuesMock = vi.fn();
  return {
    getDataRange: vi
      .fn()
      .mockReturnValue({ getValues: vi.fn().mockReturnValue(rows) }),
    getRange: vi.fn().mockReturnValue({ setValues: setValuesMock }),
    appendRow: vi.fn(),
    _setValues: setValuesMock,
  };
}
