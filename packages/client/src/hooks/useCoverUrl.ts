import { useEffect, useState } from "react";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";
import { getCoverDisplayUrl } from "@/services/CoverService";
import { defaultCoverSyncService } from "@/services/defaultServices";
import { localCoverCache } from "@/services/LocalCoverCache";

export interface UseCoverUrlResult {
  url: string | null;
}

export function useCoverUrl(fileId: string): UseCoverUrlResult {
  const [url, setUrl] = useState<string | null>(() =>
    getCoverDisplayUrl(fileId),
  );

  useEffect(() => {
    if (!fileId || fileId.startsWith(LOCAL_COVER_ID_PREFIX)) return;

    const cached = localCoverCache.get(fileId);
    if (cached) {
      setUrl(cached);
      return;
    }

    void defaultCoverSyncService.ensureCoverCached(fileId).then(() => {
      setUrl(localCoverCache.get(fileId) ?? null);
    });
  }, [fileId]);

  return { url };
}
