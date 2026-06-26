/**
 * Resolves the effective sidebar state from three factors:
 * screen width (narrow/wide), hover capability, and user preference.
 *
 * Implements FR8 of improve-sidebar-ux.
 */
import type { SidebarEffectiveState, SidebarMode } from "@/types/common";

export function resolveSidebarState(
  isNarrow: boolean,
  hasHover: boolean,
  sidebarMode: SidebarMode,
): SidebarEffectiveState {
  if (!isNarrow) {
    // Wide screen
    if (sidebarMode === "expanded") return "expanded";
    if (sidebarMode === "collapsed") return "collapsed";
    // expand-on-hover
    return hasHover ? "hover-ready" : "collapsed";
  }

  // Narrow screen
  if (sidebarMode === "collapsed") return "collapsed";
  // expanded or expand-on-hover on narrow
  return hasHover ? "hover-ready" : "collapsed";
}
