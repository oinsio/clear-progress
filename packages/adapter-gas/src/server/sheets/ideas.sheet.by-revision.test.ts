import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSheet } from "./client";
import { getIdeasByRevision } from "./ideas.sheet";
import {
  IDEA_HEADERS,
  makeIdeaRow,
  makeSheetMock,
} from "./ideas.sheet-test-utils";

vi.mock("./client", () => ({ getSheet: vi.fn() }));

describe("getIdeasByRevision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ideas with revision strictly greater than sinceRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-1", revision: 3 }),
        makeIdeaRow({ id: "idea-2", revision: 5 }),
      ]) as never,
    );

    const ideas = getIdeasByRevision(2);
    expect(ideas.map((i) => i.id)).toEqual(["idea-1", "idea-2"]);
  });

  it("should not return ideas with revision equal to sinceRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ revision: 5 })]) as never,
    );

    expect(getIdeasByRevision(5)).toHaveLength(0);
  });

  it("should not return ideas with revision less than sinceRevision", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ revision: 3 })]) as never,
    );

    expect(getIdeasByRevision(5)).toHaveLength(0);
  });

  it("should return all ideas when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-1", revision: 1 }),
        makeIdeaRow({ id: "idea-2", revision: 2 }),
      ]) as never,
    );

    expect(getIdeasByRevision(0)).toHaveLength(2);
  });

  it("should return legacy ideas with revision=0 when sinceRevision is 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-legacy", revision: 0 }),
        makeIdeaRow({ id: "idea-revised", revision: 3 }),
      ]) as never,
    );

    expect(getIdeasByRevision(0)).toHaveLength(2);
  });

  it("should return legacy ideas with revision=0 even when sinceRevision is greater than 0", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([
        IDEA_HEADERS,
        makeIdeaRow({ id: "idea-legacy", revision: 0 }),
        makeIdeaRow({ id: "idea-old", revision: 2 }),
      ]) as never,
    );

    const ideas = getIdeasByRevision(5);
    expect(ideas.map((i) => i.id)).toEqual(["idea-legacy"]);
  });

  it("should return empty array when no ideas match", () => {
    vi.mocked(getSheet).mockReturnValue(
      makeSheetMock([IDEA_HEADERS, makeIdeaRow({ revision: 1 })]) as never,
    );

    expect(getIdeasByRevision(10)).toEqual([]);
  });
});
