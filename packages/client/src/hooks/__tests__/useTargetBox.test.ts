import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockDefaultBox = vi.hoisted(() => ({ value: "inbox" as string }));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    defaultBox: mockDefaultBox.value,
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn(),
    setAccentColor: vi.fn(),
  }),
}));

import { BOX, BOX_FILTER_ALL } from "@/constants";
import type { Box, BoxFilter } from "@/types/common";
import { useTargetBox } from "../useTargetBox";

describe("useTargetBox", () => {
  it.each([
    [BOX.TODAY, BOX.TODAY],
    [BOX.INBOX, BOX.INBOX],
    [BOX.WEEK, BOX.WEEK],
    [BOX.LATER, BOX.LATER],
  ] satisfies [
    Box,
    Box,
  ][])("should return '%s' when activeBox is '%s'", (activeBox: BoxFilter, expectedBox: Box) => {
    const { result } = renderHook(() => useTargetBox(activeBox));
    expect(result.current).toBe(expectedBox);
  });

  it("should return default box from settings when activeBox is 'all' and default is 'today'", () => {
    mockDefaultBox.value = BOX.TODAY;
    const { result } = renderHook(() => useTargetBox(BOX_FILTER_ALL));
    expect(result.current).toBe(BOX.TODAY);
  });

  it("should return default box from settings when activeBox is 'all' and default is 'inbox'", () => {
    mockDefaultBox.value = BOX.INBOX;
    const { result } = renderHook(() => useTargetBox(BOX_FILTER_ALL));
    expect(result.current).toBe(BOX.INBOX);
  });
});
