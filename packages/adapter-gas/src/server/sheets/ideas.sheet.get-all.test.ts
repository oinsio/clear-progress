import { beforeEach, describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "../helpers/constants";
import { getSheet } from "./client";
import { getAllIdeas } from "./ideas.sheet";
import {
  IDEA_HEADERS,
  makeIdeaRow,
  makeSheetMock,
} from "./ideas.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getAllIdeas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when sheet has only a header row", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([IDEA_HEADERS]) as never);

    expect(getAllIdeas()).toEqual([]);
  });

  it("should return empty array when sheet has no rows", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(getAllIdeas()).toEqual([]);
  });

  it("should skip rows where first column is empty", () => {
    const emptyRow = IDEA_HEADERS.map(() => "");
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, emptyRow]) as never,
    );

    expect(getAllIdeas()).toEqual([]);
  });

  it("should return one idea when sheet has one data row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow()]) as never,
    );

    expect(getAllIdeas()).toHaveLength(1);
  });

  it("should return multiple ideas", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-1" }),
        makeIdeaRow({ id: "idea-2" }),
        makeIdeaRow({ id: "idea-3" }),
      ]) as never,
    );

    expect(getAllIdeas()).toHaveLength(3);
  });

  it("should correctly map string fields from row", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({
          id: "idea-abc",
          name: "Startup Idea",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-06-01T00:00:00.000Z",
        }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.id).toBe("idea-abc");
    expect(idea.name).toBe("Startup Idea");
    expect(idea.created_at).toBe("2025-01-01T00:00:00.000Z");
    expect(idea.updated_at).toBe("2025-06-01T00:00:00.000Z");
  });

  it("should map numeric fields sort_order and revision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ sort_order: 2, revision: 5 }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.sort_order).toBe(2);
    expect(idea.revision).toBe(5);
  });

  it("should correctly map description field", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ description: "Build a SaaS product" }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.description).toBe("Build a SaaS product");
  });

  it("should coerce null description to empty string", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ description: null }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.description).toBe("");
  });

  it("should coerce undefined description to empty string", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ description: undefined }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.description).toBe("");
  });

  it('should coerce string "TRUE" for is_deleted', () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ is_deleted: "TRUE" }),
      ]) as never,
    );

    expect(getAllIdeas()[0].is_deleted).toBe(true);
  });

  it("should coerce boolean true for is_deleted", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ is_deleted: true })]) as never,
    );

    expect(getAllIdeas()[0].is_deleted).toBe(true);
  });

  it("should coerce false for is_deleted when value is not TRUE", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ is_deleted: "false" }),
      ]) as never,
    );

    expect(getAllIdeas()[0].is_deleted).toBe(false);
  });

  it("should call getSheet with Ideas sheet name", () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    getAllIdeas();

    expect(getSheet).toHaveBeenCalledWith(SHEET_NAMES.IDEAS);
  });

  it("should coerce null row values to empty string for string fields", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({
          name: null,
          description: null,
          created_at: null,
          updated_at: null,
        }),
      ]) as never,
    );

    const [idea] = getAllIdeas();
    expect(idea.name).toBe("");
    expect(idea.description).toBe("");
    expect(idea.created_at).toBe("");
    expect(idea.updated_at).toBe("");
  });
});
