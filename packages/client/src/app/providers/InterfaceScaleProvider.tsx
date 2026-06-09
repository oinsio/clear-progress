// implements FR6, FR7 of localstorage-refactor
import type * as React from "react";
import { createContext, useContext, useEffect } from "react";
import {
  DEFAULT_INTERFACE_SCALE,
  INTERFACE_SCALES,
  STORAGE_KEYS,
} from "@/constants";
import { usePreference } from "@/hooks/usePreference";
import type { InterfaceScale } from "@/types/common";

interface InterfaceScaleContextValue {
  interfaceScale: InterfaceScale;
  setInterfaceScale: (scale: InterfaceScale) => void;
}

const InterfaceScaleContext = createContext<InterfaceScaleContextValue | null>(
  null,
);

function applyInterfaceScale(scale: InterfaceScale): void {
  document.documentElement.setAttribute("data-scale", scale);
}

export function InterfaceScaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [interfaceScale, setInterfaceScale] = usePreference<InterfaceScale>({
    type: "enum",
    key: STORAGE_KEYS.INTERFACE_SCALE,
    values: INTERFACE_SCALES,
    defaultValue: DEFAULT_INTERFACE_SCALE,
  });

  useEffect(() => {
    applyInterfaceScale(interfaceScale);
  }, [interfaceScale]);

  return (
    <InterfaceScaleContext.Provider
      value={{ interfaceScale, setInterfaceScale }}
    >
      {children}
    </InterfaceScaleContext.Provider>
  );
}

export function useInterfaceScale(): InterfaceScaleContextValue {
  const context = useContext(InterfaceScaleContext);
  if (!context) {
    throw new Error(
      "useInterfaceScale must be used within InterfaceScaleProvider",
    );
  }
  return context;
}
