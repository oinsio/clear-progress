import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCategoriesByRevision } from "./categories.sheet";
import {
  CAT_HEADERS,
  makeCategoryRow,
  makeSheetMock,
} from "./categories.sheet-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getCategoriesByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return categories with revision strictly greater than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ id: "cat-1", revision: 3 }),
        makeCategoryRow({ id: "cat-2", revision: 5 }),
      ]) as never,
    );

    const categories = getCategoriesByRevision(2);
    expect(categories.map((c) => c.id)).toEqual(["cat-1", "cat-2"]);
  });

  it("should not return categories with revision equal to minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CAT_HEADERS, makeCategoryRow({ revision: 5 })]) as never,
    );

    expect(getCategoriesByRevision(5)).toHaveLength(0);
  });

  it("should not return categories with revision less than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CAT_HEADERS, makeCategoryRow({ revision: 3 })]) as never,
    );

    expect(getCategoriesByRevision(5)).toHaveLength(0);
  });

  it("should return all categories when minRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ id: "cat-1", revision: 1 }),
        makeCategoryRow({ id: "cat-2", revision: 2 }),
      ]) as never,
    );

    expect(getCategoriesByRevision(0)).toHaveLength(2);
  });

  it("should return legacy categories with revision=0 when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ id: "cat-legacy", revision: 0 }),
        makeCategoryRow({ id: "cat-revised", revision: 3 }),
      ]) as never,
    );

    expect(getCategoriesByRevision(0)).toHaveLength(2);
  });

  it("should return legacy categories with revision=0 even when sinceRevision is greater than 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        CAT_HEADERS,
        makeCategoryRow({ id: "cat-legacy", revision: 0 }),
        makeCategoryRow({ id: "cat-old", revision: 2 }),
      ]) as never,
    );

    const categories = getCategoriesByRevision(5);
    expect(categories.map((c) => c.id)).toEqual(["cat-legacy"]);
  });

  it("should return empty array when no categories match", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([CAT_HEADERS, makeCategoryRow({ revision: 1 })]) as never,
    );

    expect(getCategoriesByRevision(10)).toEqual([]);
  });
});
