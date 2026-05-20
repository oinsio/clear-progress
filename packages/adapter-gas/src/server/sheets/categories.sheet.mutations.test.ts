import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../types";
import { deleteCategoriesByIds, upsertCategories } from "./categories.sheet";
import {
  CAT_HEADERS,
  makeCategoryRow,
  makeSheetMock,
} from "./categories.sheet-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteCategoriesByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteCategoriesByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteCategoriesByIds(["cat-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-1" }),
      makeCategoryRow({ id: "cat-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteCategoriesByIds(["cat-1", "cat-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-1" }),
      makeCategoryRow({ id: "cat-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(["cat-1", "cat-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-keep" }),
      makeCategoryRow({ id: "cat-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(["cat-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-1" }), // row 2
      makeCategoryRow({ id: "cat-2" }), // row 3
      makeCategoryRow({ id: "cat-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(["cat-1", "cat-2", "cat-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    const sheetMock = makeSheetMock([
      CAT_HEADERS,
      makeCategoryRow({ id: "cat-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteCategoriesByIds(["cat-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new category", () => {
    const sheetMock = makeSheetMock([CAT_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newCategory: Category = {
      id: "cat-new",
      name: "Fitness",
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertCategories([newCategory]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
