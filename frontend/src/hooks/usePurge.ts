import { useState } from "react";
import { defaultSyncService } from "@/services/defaultServices";

export function usePurge() {
  const [isPurging, setIsPurging] = useState(false);

  const purge = async () => {
    setIsPurging(true);
    try {
      return await defaultSyncService.purge();
    } finally {
      setIsPurging(false);
    }
  };

  return { purge, isPurging };
}
