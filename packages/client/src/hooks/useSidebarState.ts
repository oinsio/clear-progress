/**
 * Combines screen width, hover capability, and sidebar mode preference
 * to resolve the effective sidebar state.
 *
 * Implements FR8 of improve-sidebar-ux.
 */

import { useHoverCapability } from "@/hooks/useHoverCapability";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useSidebarMode } from "@/hooks/useSidebarMode";
import type { SidebarEffectiveState, SidebarMode } from "@/types/common";
import { resolveSidebarState } from "./resolveSidebarState";

export interface UseSidebarStateReturn {
  effectiveState: SidebarEffectiveState;
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  isNarrow: boolean;
  hasHover: boolean;
}

export function useSidebarState(): UseSidebarStateReturn {
  const isDesktop = useIsDesktop();
  const hasHover = useHoverCapability();
  const [sidebarMode, setSidebarMode] = useSidebarMode();

  const isNarrow = !isDesktop;
  const effectiveState = resolveSidebarState(isNarrow, hasHover, sidebarMode);

  return {
    effectiveState,
    sidebarMode,
    setSidebarMode,
    isNarrow,
    hasHover,
  };
}
