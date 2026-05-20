import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChecklistItem } from "../types";
import {
  deleteChecklistItemsByIds,
  upsertChecklistItems,
} from "./checklists.sheet";
import {
  ITEM_HEADERS,
  makeItemRow,
  makeSheetMock,
} from "./checklists.sheet-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteChecklistItemsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteChecklistItemsByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteChecklistItemsByIds(["item-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-1" }),
      makeItemRow({ id: "item-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteChecklistItemsByIds(["item-1", "item-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-1" }),
      makeItemRow({ id: "item-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(["item-1", "item-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-keep" }),
      makeItemRow({ id: "item-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(["item-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-1" }), // row 2
      makeItemRow({ id: "item-2" }), // row 3
      makeItemRow({ id: "item-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(["item-1", "item-2", "item-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    const sheetMock = makeSheetMock([
      ITEM_HEADERS,
      makeItemRow({ id: "item-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteChecklistItemsByIds(["item-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertChecklistItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new checklist item", () => {
    const sheetMock = makeSheetMock([ITEM_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newItem: ChecklistItem = {
      id: "item-new",
      task_id: "11111111-1111-4111-a111-111111111111",
      name: "Buy milk",
      is_completed: false,
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertChecklistItems([newItem]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
