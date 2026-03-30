import { useAuth } from "@/app/providers/AuthProvider";
import { useSync } from "@/app/providers/SyncProvider";
import { useBackendConnected } from "@/hooks/useBackendConnected";

export type ConnectionStatus =
  | "not_configured"
  | "no_auth"
  | "syncing"
  | "synced"
  | "offline"
  | "error"
  | "unauthorized";

export function useConnectionStatus(): ConnectionStatus {
  const isBackendConnected = useBackendConnected();
  const { accessToken } = useAuth();
  const { syncStatus } = useSync();

  if (!isBackendConnected) return "not_configured";
  if (!accessToken) return "no_auth";
  if (syncStatus === "offline") return "offline";
  if (syncStatus === "error") return "error";
  if (syncStatus === "unauthorized") return "unauthorized";
  if (syncStatus === "syncing") return "syncing";
  return "synced";
}
