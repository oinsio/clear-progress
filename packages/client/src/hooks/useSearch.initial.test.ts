import { beforeEach, describe, expect, it } from "vitest";
import {
  createSearchMocks,
  renderUseSearch,
  type SearchMocks,
} from "./useSearch.test-utils";

describe("useSearch — initial state", () => {
  let mocks: SearchMocks;

  beforeEach(() => {
    mocks = createSearchMocks();
  });

  it("should return empty tasks on initial render", () => {
    const { result } = renderUseSearch(mocks);
    expect(result.current.tasks).toEqual([]);
  });

  it("should return empty goals on initial render", () => {
    const { result } = renderUseSearch(mocks);
    expect(result.current.goals).toEqual([]);
  });

  it("should not be searching on initial render", () => {
    const { result } = renderUseSearch(mocks);
    expect(result.current.isSearching).toBe(false);
  });

  it("should return empty ideas on initial render", () => {
    const { result } = renderUseSearch(mocks);
    expect(result.current.ideas).toEqual([]);
  });
});
