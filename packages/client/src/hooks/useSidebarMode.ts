/**
 * Manages the user's sidebar mode preference with migration from legacy keys.
 *
 * Implements FR1 of improve-sidebar-ux.
 * Implements FR10 of improve-sidebar-ux (legacy key migration).
 */
import { DEFAULT_SIDEBAR_MODE, SIDEBAR_MODES, STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";
import type { SidebarMode } from "@/types/common";

/** Legacy localStorage key from the old "always open" toggle. */
export const LEGACY_ALWAYS_OPEN_KEY = "panel_always_open";

/** Legacy localStorage key from the boolean panel open/close toggle. */
export const LEGACY_PANEL_OPEN_KEY = "panel_open";

/**
 * Migrate legacy "panel_always_open" to "panel_open" and remove the old key.
 *
 * Implements FR10 of improve-sidebar-ux.
 */
export function migratePanelAlwaysOpen(): void {
  const legacyValue = localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY);
  if (legacyValue === null) return;

  if (legacyValue === "true") {
    localStorage.setItem(LEGACY_PANEL_OPEN_KEY, "true");
  }
  localStorage.removeItem(LEGACY_ALWAYS_OPEN_KEY);
}

/**
 * Migrate legacy "panel_open" to "sidebar_mode" and remove the old key.
 * If sidebar_mode is already set, no migration is performed.
 */
export function migratePanelOpenToSidebarMode(): void {
  if (localStorage.getItem(STORAGE_KEYS.SIDEBAR_MODE) !== null) return;

  const panelOpen = localStorage.getItem(LEGACY_PANEL_OPEN_KEY);
  if (panelOpen === null) return;

  const migratedMode: SidebarMode =
    panelOpen === "true" ? "expanded" : "collapsed";
  localStorage.setItem(STORAGE_KEYS.SIDEBAR_MODE, migratedMode);
  localStorage.removeItem(LEGACY_PANEL_OPEN_KEY);
}

export function useSidebarMode(): [SidebarMode, (mode: SidebarMode) => void] {
  migratePanelAlwaysOpen();
  migratePanelOpenToSidebarMode();

  return usePreference<SidebarMode>({
    type: "enum",
    key: STORAGE_KEYS.SIDEBAR_MODE,
    values: SIDEBAR_MODES,
    defaultValue: DEFAULT_SIDEBAR_MODE,
  });
}
