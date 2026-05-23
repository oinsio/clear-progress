import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Idea } from "../types";
import { getSheet } from "./client";
import { deleteIdeasByIds, upsertIdeas } from "./ideas.sheet";
import {
  IDEA_HEADERS,
  makeIdeaRow,
  makeSheetMock,
} from "./ideas.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("deleteIdeasByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when ids array is empty", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteIdeasByIds([])).toBe(0);
  });

  it("should return 0 when no rows match the given ids", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteIdeasByIds(["idea-nonexistent"])).toBe(0);
  });

  it("should return count of deleted rows", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
      makeIdeaRow({ id: "idea-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    expect(deleteIdeasByIds(["idea-1", "idea-2"])).toBe(2);
  });

  it("should call deleteRow for each matched id", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
      makeIdeaRow({ id: "idea-2" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-1", "idea-2"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(2);
  });

  it("should not call deleteRow for rows not in the ids list", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-keep" }),
      makeIdeaRow({ id: "idea-delete" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-delete"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledTimes(1);
  });

  it("should delete rows in reverse order to preserve row indices", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }), // row 2
      makeIdeaRow({ id: "idea-2" }), // row 3
      makeIdeaRow({ id: "idea-3" }), // row 4
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-1", "idea-2", "idea-3"]);

    const deletedRows = sheetMock.deleteRow.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(deletedRows[0]).toBeGreaterThan(deletedRows[1]);
    expect(deletedRows[1]).toBeGreaterThan(deletedRows[2]);
  });

  it("should delete the correct 1-based row index", () => {
    const sheetMock = makeSheetMock([
      IDEA_HEADERS,
      makeIdeaRow({ id: "idea-1" }),
    ]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    deleteIdeasByIds(["idea-1"]);

    expect(sheetMock.deleteRow).toHaveBeenCalledWith(2);
  });
});

describe("upsertIdeas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call appendRow when adding a new idea", () => {
    const sheetMock = makeSheetMock([IDEA_HEADERS]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    const newIdea: Idea = {
      id: "idea-new",
      name: "New Idea",
      description: "A brand new idea",
      sort_order: 0,
      is_deleted: false,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
      revision: 0,
    };
    upsertIdeas([newIdea]);

    expect(sheetMock.appendRow).toHaveBeenCalledTimes(1);
  });
});
