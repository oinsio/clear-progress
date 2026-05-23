import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getAllChecklistItems } from "./checklists.sheet";
import {
  ITEM_HEADERS,
  makeItemRow,
  makeSheetMock,
} from "./checklists.sheet-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllChecklistItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([ITEM_HEADERS]) as never);

    expect(getAllChecklistItems()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllChecklistItems()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = ITEM_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([ITEM_HEADERS, emptyRow]) as never,
    );

    expect(getAllChecklistItems()).toEqual([]);
  });

  it("should return one item when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([ITEM_HEADERS, makeItemRow()]) as never,
    );

    expect(getAllChecklistItems()).toHaveLength(1);
  });

  it("should return multiple items", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ id: "item-1" }),
        makeItemRow({ id: "item-2" }),
        makeItemRow({ id: "item-3" }),
      ]) as never,
    );

    expect(getAllChecklistItems()).toHaveLength(3);
  });

  it("should correctly map string fields from row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({
          id: "item-abc",
          task_id: "task-xyz",
          name: "Buy milk",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [item] = getAllChecklistItems();
    expect(item.id).toBe("item-abc");
    expect(item.task_id).toBe("task-xyz");
    expect(item.name).toBe("Buy milk");
    expect(item.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(item.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("should map numeric field sort_order", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([ITEM_HEADERS, makeItemRow({ sort_order: 3 })]) as never,
    );

    const [item] = getAllChecklistItems();
    expect(item.sort_order).toBe(3);
  });

  it('should coerce string "TRUE" for is_completed', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ is_completed: "TRUE" }),
      ]) as never,
    );

    expect(getAllChecklistItems()[0].is_completed).toBe(true);
  });

  it("should coerce boolean true for is_completed", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ is_completed: true }),
      ]) as never,
    );

    expect(getAllChecklistItems()[0].is_completed).toBe(true);
  });

  it("should coerce false for is_completed when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ is_completed: "false" }),
      ]) as never,
    );

    expect(getAllChecklistItems()[0].is_completed).toBe(false);
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ is_deleted: "TRUE" }),
      ]) as never,
    );

    expect(getAllChecklistItems()[0].is_deleted).toBe(true);
  });

  it("should coerce false for is_deleted when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ is_deleted: "false" }),
      ]) as never,
    );

    expect(getAllChecklistItems()[0].is_deleted).toBe(false);
  });

  it("should call getSheet with Checklist_Items sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllChecklistItems();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.CHECKLIST_ITEMS);
  });

  it("should coerce null row values to empty string for string fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({
          task_id: null,
          name: null,
          created_at: null,
          updated_at: null,
        }),
      ]) as never,
    );

    const [item] = getAllChecklistItems();
    expect(item.task_id).toBe("");
    expect(item.name).toBe("");
    expect(item.created_at).toBe("");
    expect(item.updated_at).toBe("");
  });
});
