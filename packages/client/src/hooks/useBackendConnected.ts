import { useConnectionConfig } from "@/hooks/useConnectionConfig";

/**
 * @deprecated Use useConnectionConfig() instead. This hook is kept for backward compatibility.
 * Returns true if a backend connection is configured, false otherwise.
 */
export function useBackendConnected(): boolean {
  const config = useConnectionConfig();
  return config !== null;
}
