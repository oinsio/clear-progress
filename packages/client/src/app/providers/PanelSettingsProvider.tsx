import type * as React from "react";
import { createContext, useCallback, useState } from "react";
import { STORAGE_KEYS } from "@/constants";

interface PanelSettingsContextValue {
  isPanelAlwaysOpen: boolean;
  setPanelAlwaysOpen: (value: boolean) => void;
}

export const PanelSettingsContext =
  createContext<PanelSettingsContextValue | null>(null);

function getCachedPanelAlwaysOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.PANEL_ALWAYS_OPEN) === "true";
  } catch {
    // localStorage недоступен
  }
  return false;
}

export function PanelSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPanelAlwaysOpen, setIsPanelAlwaysOpenState] = useState<boolean>(
    getCachedPanelAlwaysOpen,
  );

  const setPanelAlwaysOpen = useCallback((value: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PANEL_ALWAYS_OPEN, String(value));
    } catch {
      // localStorage недоступен
    }
    setIsPanelAlwaysOpenState(value);
  }, []);

  return (
    <PanelSettingsContext.Provider
      value={{ isPanelAlwaysOpen, setPanelAlwaysOpen }}
    >
      {children}
    </PanelSettingsContext.Provider>
  );
}
