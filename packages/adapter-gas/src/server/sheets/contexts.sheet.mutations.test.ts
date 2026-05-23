import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../types";
import { getSheet } from "./client";
import { deleteContextsByIds, upsertContexts } from "./contexts.sheet";
import {
  CTX_HEADERS,
  makeContextRow,
  makeSheetMock,
} from "./contexts.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteContextsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteContextsByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteContextsByIds(["ctx-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-1" }),
      makeContextRow({ id: "ctx-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteContextsByIds(["ctx-1", "ctx-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-1" }),
      makeContextRow({ id: "ctx-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(["ctx-1", "ctx-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-keep" }),
      makeContextRow({ id: "ctx-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(["ctx-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-1" }), // row 2
      makeContextRow({ id: "ctx-2" }), // row 3
      makeContextRow({ id: "ctx-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(["ctx-1", "ctx-2", "ctx-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    const sheetMock = makeSheetMock([
      CTX_HEADERS,
      makeContextRow({ id: "ctx-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteContextsByIds(["ctx-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertContexts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new context", () => {
    const sheetMock = makeSheetMock([CTX_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newContext: Context = {
      id: "ctx-new",
      name: "@Work",
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertContexts([newContext]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
