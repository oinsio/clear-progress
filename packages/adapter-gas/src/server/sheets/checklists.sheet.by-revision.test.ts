import { beforeEach, describe, expect, it, vi } from "vitest";
import { getChecklistItemsByRevision } from "./checklists.sheet";
import {
  ITEM_HEADERS,
  makeItemRow,
  makeSheetMock,
} from "./checklists.sheet-test-utils";
import { getSheet } from "./client";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getChecklistItemsByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return items with revision strictly greater than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ id: "item-1", revision: 3 }),
        makeItemRow({ id: "item-2", revision: 5 }),
      ]) as never,
    );

    const items = getChecklistItemsByRevision(2);
    expect(items.map((i) => i.id)).toEqual(["item-1", "item-2"]);
  });

  it("should not return items with revision equal to minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([ITEM_HEADERS, makeItemRow({ revision: 5 })]) as never,
    );

    expect(getChecklistItemsByRevision(5)).toHaveLength(0);
  });

  it("should not return items with revision less than minRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([ITEM_HEADERS, makeItemRow({ revision: 3 })]) as never,
    );

    expect(getChecklistItemsByRevision(5)).toHaveLength(0);
  });

  it("should return all items when minRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ id: "item-1", revision: 1 }),
        makeItemRow({ id: "item-2", revision: 2 }),
      ]) as never,
    );

    expect(getChecklistItemsByRevision(0)).toHaveLength(2);
  });

  it("should return legacy items with revision=0 when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ id: "item-legacy", revision: 0 }),
        makeItemRow({ id: "item-revised", revision: 3 }),
      ]) as never,
    );

    expect(getChecklistItemsByRevision(0)).toHaveLength(2);
  });

  it("should return legacy items with revision=0 even when sinceRevision is greater than 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        ITEM_HEADERS,
        makeItemRow({ id: "item-legacy", revision: 0 }),
        makeItemRow({ id: "item-old", revision: 2 }),
      ]) as never,
    );

    const items = getChecklistItemsByRevision(5);
    expect(items.map((i) => i.id)).toEqual(["item-legacy"]);
  });

  it("should return empty array when no items match", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([ITEM_HEADERS, makeItemRow({ revision: 1 })]) as never,
    );

    expect(getChecklistItemsByRevision(10)).toEqual([]);
  });
});
