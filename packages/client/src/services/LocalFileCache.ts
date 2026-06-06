/** Implements FR4 of add-file-attachments */
const urlCache = new Map<string, string>();

export const localFileCache = {
  set(hash: string, url: string): void {
    urlCache.set(hash, url);
  },
  get(hash: string): string | undefined {
    return urlCache.get(hash);
  },
  delete(hash: string): void {
    const url = urlCache.get(hash);
    if (url) URL.revokeObjectURL(url);
    urlCache.delete(hash);
  },
  clear(): void {
    for (const url of urlCache.values()) {
      URL.revokeObjectURL(url);
    }
    urlCache.clear();
  },
};
