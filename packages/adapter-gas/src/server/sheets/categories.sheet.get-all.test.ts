import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getAllCategories } from "./categories.sheet";
import {
  CAT_HEADERS,
  makeCategoryRow,
  makeSheetMock,
} from "./categories.sheet-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([CAT_HEADERS]) as never);

    expect(getAllCategories()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllCategories()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = CAT_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CAT_HEADERS, emptyRow]) as never,
    );

    expect(getAllCategories()).toEqual([]);
  });

  it("should return one category when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CAT_HEADERS, makeCategoryRow()]) as never,
    );

    expect(getAllCategories()).toHaveLength(1);
  });

  it("should return multiple categories", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ id: "cat-1" }),
        makeCategoryRow({ id: "cat-2" }),
        makeCategoryRow({ id: "cat-3" }),
      ]) as never,
    );

    expect(getAllCategories()).toHaveLength(3);
  });

  it("should correctly map string fields from row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({
          id: "cat-abc",
          name: "Family",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [category] = getAllCategories();
    expect(category.id).toBe("cat-abc");
    expect(category.name).toBe("Family");
    expect(category.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(category.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("should map numeric field sort_order", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CAT_HEADERS, makeCategoryRow({ sort_order: 4 })]) as never,
    );

    const [category] = getAllCategories();
    expect(category.sort_order).toBe(4);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ is_deleted: "TRUE" }),
      ]) as never,
    );

    expect(getAllCategories()[0].is_deleted).toBe(true);
  });

  it("should coerce boolean true for is_deleted", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ is_deleted: true }),
      ]) as never,
    );

    expect(getAllCategories()[0].is_deleted).toBe(true);
  });

  it("should coerce false for is_deleted when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ is_deleted: "false" }),
      ]) as never,
    );

    expect(getAllCategories()[0].is_deleted).toBe(false);
  });

  it("should call getSheet with Categories sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllCategories();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.CATEGORIES);
  });

  it("should coerce null row values to empty string for string fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ name: null, created_at: null, updated_at: null }),
      ]) as never,
    );

    const [category] = getAllCategories();
    expect(category.name).toBe("");
    expect(category.created_at).toBe("");
    expect(category.updated_at).toBe("");
  });
});
