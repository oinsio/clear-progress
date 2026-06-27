// implements FR8 of improve-sidebar-ux
import { describe, expect, it } from "vitest";
import type { SidebarEffectiveState, SidebarMode } from "@/types/common";
import { resolveSidebarState } from "./resolveSidebarState";

describe("resolveSidebarState", () => {
  it.each<{
    isNarrow: boolean;
    hasHover: boolean;
    sidebarMode: SidebarMode;
    expected: SidebarEffectiveState;
  }>([
    // Wide + Hover
    {
      isNarrow: false,
      hasHover: true,
      sidebarMode: "expanded",
      expected: "expanded",
    },
    {
      isNarrow: false,
      hasHover: true,
      sidebarMode: "collapsed",
      expected: "collapsed",
    },
    {
      isNarrow: false,
      hasHover: true,
      sidebarMode: "expand-on-hover",
      expected: "hover-ready",
    },
    // Wide + No hover
    {
      isNarrow: false,
      hasHover: false,
      sidebarMode: "expanded",
      expected: "expanded",
    },
    {
      isNarrow: false,
      hasHover: false,
      sidebarMode: "collapsed",
      expected: "collapsed",
    },
    {
      isNarrow: false,
      hasHover: false,
      sidebarMode: "expand-on-hover",
      expected: "collapsed",
    },
    // Narrow + Hover
    {
      isNarrow: true,
      hasHover: true,
      sidebarMode: "expanded",
      expected: "hover-ready",
    },
    {
      isNarrow: true,
      hasHover: true,
      sidebarMode: "collapsed",
      expected: "collapsed",
    },
    {
      isNarrow: true,
      hasHover: true,
      sidebarMode: "expand-on-hover",
      expected: "hover-ready",
    },
    // Narrow + No hover
    {
      isNarrow: true,
      hasHover: false,
      sidebarMode: "expanded",
      expected: "collapsed",
    },
    {
      isNarrow: true,
      hasHover: false,
      sidebarMode: "collapsed",
      expected: "collapsed",
    },
    {
      isNarrow: true,
      hasHover: false,
      sidebarMode: "expand-on-hover",
      expected: "collapsed",
    },
  ])("should return $expected when isNarrow=$isNarrow, hasHover=$hasHover, sidebarMode=$sidebarMode", ({
    isNarrow,
    hasHover,
    sidebarMode,
    expected,
  }) => {
    const effectiveState = resolveSidebarState(isNarrow, hasHover, sidebarMode);

    expect(effectiveState).toBe(expected);
  });
});
