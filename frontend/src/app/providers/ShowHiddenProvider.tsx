import React, { createContext, useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants";

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
  const [showHidden, setShowHidden] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS) === "true";
  });

  const toggleShowHidden = useCallback(() => {
    setShowHidden((previous) => {
      const newValue = !previous;
      localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, String(newValue));
      return newValue;
    });
  }, []);

  return (
    <ShowHiddenContext.Provider value={{ showHidden, toggleShowHidden }}>
      {children}
    </ShowHiddenContext.Provider>
  );
}
