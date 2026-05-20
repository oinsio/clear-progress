import { vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

export interface SheetMock {
  getDataRange: MockFn;
  getRange: MockFn;
  appendRow: MockFn;
  deleteRow: MockFn;
  _setValues: MockFn;
}

export function makeSheetMock(rows: unknown[][] = []): SheetMock {
  const setValuesMock = vi.fn();
  return {
    getDataRange: vi
      .fn()
      .mockReturnValue({ getValues: vi.fn().mockReturnValue(rows) }),
    getRange: vi.fn().mockReturnValue({ setValues: setValuesMock }),
    appendRow: vi.fn(),
    deleteRow: vi.fn(),
    _setValues: setValuesMock,
  };
}
