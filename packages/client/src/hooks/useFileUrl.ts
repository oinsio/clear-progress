import { useEffect, useState } from "react";
import { defaultFileSyncService } from "@/services/defaultServices";
import { getFileDisplayUrl } from "@/services/FileService";
import { localFileCache } from "@/services/LocalFileCache";

export interface UseFileUrlResult {
  url: string | null;
}

// implements FR1 of content-addressable-covers
export function useFileUrl(fileHash: string): UseFileUrlResult {
  const [url, setUrl] = useState<string | null>(() =>
    getFileDisplayUrl(fileHash),
  );

  useEffect(() => {
    if (!fileHash) return;

    const cached = localFileCache.get(fileHash);
    if (cached) {
      setUrl(cached);
      return;
    }

    void defaultFileSyncService.ensureFileCached(fileHash).then(() => {
      setUrl(localFileCache.get(fileHash) ?? null);
    });
  }, [fileHash]);

  return { url };
}
