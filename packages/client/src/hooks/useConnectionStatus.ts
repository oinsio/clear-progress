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
  const { syncStatus } = useSync();

  if (!config) return "not_configured";

  // Common sync statuses
  if (syncStatus === "offline") return "offline";
  if (syncStatus === "error") return "error";
  if (syncStatus === "unauthorized") return "unauthorized";
  if (syncStatus === "syncing") return "syncing";
  return "synced";
}
