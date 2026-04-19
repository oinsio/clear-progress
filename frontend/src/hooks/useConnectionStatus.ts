import { useAuth } from "@/app/providers/AuthProvider";
import { useSync } from "@/app/providers/SyncProvider";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";

export type ConnectionStatus =
  | "not_configured"
  | "no_auth"
  | "syncing"
  | "synced"
  | "offline"
  | "error"
  | "unauthorized";

export function useConnectionStatus(): ConnectionStatus {
  const config = useConnectionConfig();
  const { accessToken } = useAuth();
  const { syncStatus } = useSync();

  if (!config) return "not_configured";

  // Backend-specific auth check
  if (config.type === "gas" && config.clientId && !accessToken) {
    return "no_auth";
  }

  // Common sync statuses
  if (syncStatus === "offline") return "offline";
  if (syncStatus === "error") return "error";
  if (syncStatus === "unauthorized") return "unauthorized";
  if (syncStatus === "syncing") return "syncing";
  return "synced";
}
