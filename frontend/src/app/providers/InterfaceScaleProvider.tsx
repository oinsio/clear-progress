import { createContext, useContext, useEffect, useState } from "react";
import type { InterfaceScale } from "@/types/common";
import {
  INTERFACE_SCALES,
  DEFAULT_INTERFACE_SCALE,
  STORAGE_KEYS,
} from "@/constants";
import * as React from "react";

interface InterfaceScaleContextValue {
  interfaceScale: InterfaceScale;
  setInterfaceScale: (scale: InterfaceScale) => void;
}

const InterfaceScaleContext = createContext<InterfaceScaleContextValue | null>(
  null,
);

function getInitialInterfaceScale(): InterfaceScale {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.INTERFACE_SCALE);
    if (cached && INTERFACE_SCALES.includes(cached as InterfaceScale)) {
      return cached as InterfaceScale;
    }
  } catch (error) {
    console.error("Failed to get interface scale from localStorage:", error);
  }
  return DEFAULT_INTERFACE_SCALE;
}

function applyInterfaceScale(scale: InterfaceScale): void {
  document.documentElement.setAttribute("data-scale", scale);
}

export function InterfaceScaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [interfaceScale, setInterfaceScaleState] = useState<InterfaceScale>(
    getInitialInterfaceScale,
  );

  useEffect(() => {
    applyInterfaceScale(interfaceScale);
  }, [interfaceScale]);

  const setInterfaceScale = (scale: InterfaceScale): void => {
    applyInterfaceScale(scale);
    setInterfaceScaleState(scale);
    try {
      localStorage.setItem(STORAGE_KEYS.INTERFACE_SCALE, scale);
    } catch (error) {
      console.error("Failed to save interface scale to localStorage:", error);
    }
  };

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
