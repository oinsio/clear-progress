// implements FR6, FR7 of localstorage-refactor
// implements FR10 of improve-sidebar-ux
// implements FR7 of improve-sidebar-ux
import { useCallback, useState } from "react";
import {
  DESKTOP_PANEL_OPEN_DEFAULT,
  MOBILE_PANEL_OPEN_DEFAULT,
  STORAGE_KEYS,
} from "@/constants";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePreference } from "@/hooks/usePreference";

export const LEGACY_ALWAYS_OPEN_KEY = "panel_always_open";

/** Migrate legacy "panel_always_open" to "panel_open" and remove the old key. */
export function migratePanelAlwaysOpen(): void {
  const legacyValue = localStorage.getItem(LEGACY_ALWAYS_OPEN_KEY);
  if (legacyValue === null) return;

  if (legacyValue === "true") {
    localStorage.setItem(STORAGE_KEYS.PANEL_OPEN, "true");
  }
  localStorage.removeItem(LEGACY_ALWAYS_OPEN_KEY);
}

export interface UsePanelOpenReturn {
  isPanelOpen: boolean;
  isTemporarilyOpen: boolean;
  effectiveIsOpen: boolean;
  togglePanelOpen: () => void;
  openTemporarily: () => void;
  closeTemporary: () => void;
}

/**
 * Manages sidebar open/close state with support for modal (temporary) mode.
 *
 * Implements FR4, FR5, FR6 of improve-sidebar-ux.
 */
export function usePanelOpen(): UsePanelOpenReturn {
  migratePanelAlwaysOpen();

  const isDesktop = useIsDesktop();
  const platformDefault = isDesktop
    ? DESKTOP_PANEL_OPEN_DEFAULT
    : MOBILE_PANEL_OPEN_DEFAULT;

  const [isPanelOpen, setIsPanelOpen] = usePreference<boolean>({
    type: "boolean",
    key: STORAGE_KEYS.PANEL_OPEN,
    defaultValue: platformDefault,
  });

  const [isTemporarilyOpen, setIsTemporarilyOpen] = useState(false);

  const togglePanelOpen = useCallback(() => {
    setIsPanelOpen(!isPanelOpen);
    setIsTemporarilyOpen(false);
  }, [isPanelOpen, setIsPanelOpen]);

  const openTemporarily = useCallback(() => {
    setIsTemporarilyOpen(true);
  }, []);

  const closeTemporary = useCallback(() => {
    setIsTemporarilyOpen(false);
  }, []);

  const effectiveIsOpen = isPanelOpen || isTemporarilyOpen;

  return {
    isPanelOpen,
    isTemporarilyOpen,
    effectiveIsOpen,
    togglePanelOpen,
    openTemporarily,
    closeTemporary,
  };
}
