import { useEffect, useState } from "react";
import { BACKEND_CONNECTION_EVENT } from "@/constants";
import { getConnectionConfig } from "@/services/connectionService";
import type { BackendType, ConnectionConfig } from "@/types/connection";

export function useConnectionConfig(): ConnectionConfig | null {
  const [config, setConfig] = useState<ConnectionConfig | null>(
    getConnectionConfig,
  );

  useEffect(() => {
    const update = () => setConfig(getConnectionConfig());
    window.addEventListener(BACKEND_CONNECTION_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(BACKEND_CONNECTION_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return config;
}

export function useBackendType(): BackendType | null {
  const config = useConnectionConfig();
  return config?.type ?? null;
}
