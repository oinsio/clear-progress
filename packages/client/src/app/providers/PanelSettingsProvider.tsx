// implements FR6, FR7 of localstorage-refactor
import type * as React from "react";
import { createContext } from "react";
import { STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";

interface PanelSettingsContextValue {
  isPanelAlwaysOpen: boolean;
  setPanelAlwaysOpen: (value: boolean) => void;
}

export const PanelSettingsContext =
  createContext<PanelSettingsContextValue | null>(null);

export function PanelSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPanelAlwaysOpen, setPanelAlwaysOpen] = usePreference<boolean>({
    type: "boolean",
    key: STORAGE_KEYS.PANEL_ALWAYS_OPEN,
    defaultValue: false,
  });

  return (
    <PanelSettingsContext.Provider
      value={{ isPanelAlwaysOpen, setPanelAlwaysOpen }}
    >
      {children}
    </PanelSettingsContext.Provider>
  );
}
