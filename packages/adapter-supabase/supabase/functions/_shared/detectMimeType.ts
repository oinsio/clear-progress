/**
 * Detects MIME type from file bytes using magic byte signatures.
 * Duplicated from @clear-progress/contract (not importable in Deno edge functions).
 * Source: packages/contract/src/validation/detectMimeType.ts
 *
 * Implements FR8 of fix-file-mime-detection.
 */

import { FILE_MAGIC_BYTES } from "./constants.ts";

const WEBP_MIME_TYPE = "image/webp";
const WEBP_MARKER_OFFSET = 8;
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

/**
 * Detects MIME type from raw file bytes by matching magic byte signatures.
 * Returns null if no known signature matches.
 * For RIFF-based formats, disambiguate WebP by checking the WEBP marker at offset 8.
 *
 * Implements FR8 of fix-file-mime-detection.
 */
export function detectMimeType(fileBytes: Uint8Array): string | null {
  if (fileBytes.length === 0) return null;

  for (const [mimeType, signatures] of Object.entries(FILE_MAGIC_BYTES)) {
    const isMatch = signatures.some((signature) => {
      if (fileBytes.length < signature.length) return false;
      return signature.every(
        (expectedByte, index) => fileBytes[index] === expectedByte,
      );
    });

    if (!isMatch) continue;

    if (mimeType === WEBP_MIME_TYPE) {
      if (!hasWebpMarker(fileBytes)) return null;
    }

    return mimeType;
  }

  return null;
}

function hasWebpMarker(fileBytes: Uint8Array): boolean {
  const requiredLength = WEBP_MARKER_OFFSET + WEBP_MARKER.length;
  if (fileBytes.length < requiredLength) return false;
  return WEBP_MARKER.every(
    (expectedByte, index) =>
      fileBytes[WEBP_MARKER_OFFSET + index] === expectedByte,
  );
}
