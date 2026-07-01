/**
 * Implements FR6, FR7 of detect-invalid-repeat-rule.
 *
 * Manages a typed, priority-sorted alert queue.
 * Sync alerts are displayed before repeat_rule_invalid alerts.
 */
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { ALERT_TYPE_PRIORITY, type AppAlert } from "@/types/alerts";

interface AlertContextValue {
  alerts: AppAlert[];
  addAlerts: (newAlerts: AppAlert[]) => void;
  dismissAlerts: () => void;
}

export const AlertContext = createContext<AlertContextValue | null>(null);

function sortAlertsByPriority(alertsToSort: AppAlert[]): AppAlert[] {
  return [...alertsToSort].sort((first, second) => {
    const firstPriority = ALERT_TYPE_PRIORITY.indexOf(first.type);
    const secondPriority = ALERT_TYPE_PRIORITY.indexOf(second.type);
    return firstPriority - secondPriority;
  });
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AppAlert[]>([]);

  const addAlerts = useCallback((newAlerts: AppAlert[]) => {
    setAlerts((previous) => sortAlertsByPriority([...previous, ...newAlerts]));
  }, []);

  const dismissAlerts = useCallback(() => setAlerts([]), []);

  return (
    <AlertContext.Provider value={{ alerts, addAlerts, dismissAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

const ALERT_FALLBACK: AlertContextValue = {
  alerts: [],
  addAlerts: () => {},
  dismissAlerts: () => {},
};

export function useAlerts(): AlertContextValue {
  return useContext(AlertContext) ?? ALERT_FALLBACK;
}
