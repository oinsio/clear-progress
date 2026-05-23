// implements FR10 of add-supabase-adapter
// Shared cover utilities

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const DEFAULT_EXTENSION = "bin";

export function getExtensionFromMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? DEFAULT_EXTENSION;
}
