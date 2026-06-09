// implements FR6, FR7 of localstorage-refactor
import type React from "react";
import { createContext, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";
import { usePreference } from "@/hooks/usePreference";

interface ShowHiddenContextValue {
  showHidden: boolean;
  toggleShowHidden: () => void;
}

export const ShowHiddenContext = createContext<ShowHiddenContextValue | null>(
  null,
);

export function ShowHiddenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showHidden, setShowHidden] = usePreference<boolean>({
    type: "boolean",
    key: STORAGE_KEYS.SHOW_HIDDEN_TASKS,
    defaultValue: false,
  });

  const toggleShowHidden = useCallback(() => {
    setShowHidden(!showHidden);
  }, [showHidden, setShowHidden]);

  return (
    <ShowHiddenContext.Provider value={{ showHidden, toggleShowHidden }}>
      {children}
    </ShowHiddenContext.Provider>
  );
}
