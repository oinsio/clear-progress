import { useEffect, useState } from "react";
import { getCoverDisplayUrl } from "@/services/CoverService";
import { defaultCoverSyncService } from "@/services/defaultServices";
import { localCoverCache } from "@/services/LocalCoverCache";

export interface UseCoverUrlResult {
  url: string | null;
}

// implements FR1 of content-addressable-covers
export function useCoverUrl(coverHash: string): UseCoverUrlResult {
  const [url, setUrl] = useState<string | null>(() =>
    getCoverDisplayUrl(coverHash),
  );

  useEffect(() => {
    if (!coverHash) return;

    const cached = localCoverCache.get(coverHash);
    if (cached) {
      setUrl(cached);
      return;
    }

    void defaultCoverSyncService.ensureCoverCached(coverHash).then(() => {
      setUrl(localCoverCache.get(coverHash) ?? null);
    });
  }, [coverHash]);

  return { url };
}
