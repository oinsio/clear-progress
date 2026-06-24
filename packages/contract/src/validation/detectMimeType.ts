import { FILE_MAGIC_BYTES } from "../constants";

const WEBP_MIME_TYPE = "image/webp";
const WEBP_MARKER_OFFSET = 8;
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

/**
 * Detects MIME type from file content by matching magic bytes.
 * Returns the first matching MIME type, or null if no match.
 *
 * Special handling for WebP: checks both RIFF header (bytes 0-3)
 * AND WEBP marker (bytes 8-11).
 *
 * Implements FR1 of fix-file-mime-detection.
 */
export function detectMimeType(buffer: ArrayBuffer): string | null {
  if (buffer.byteLength === 0) {
    return null;
  }

  const bytes = new Uint8Array(buffer);

  for (const [mimeType, signatures] of Object.entries(FILE_MAGIC_BYTES)) {
    const isMatch = signatures.some((signature) => {
      if (bytes.length < signature.length) {
        return false;
      }
      return signature.every(
        (expectedByte, index) => bytes[index] === expectedByte,
      );
    });

    if (!isMatch) {
      continue;
    }

    if (mimeType === WEBP_MIME_TYPE) {
      if (!hasWebpMarker(bytes)) {
        return null;
      }
    }

    return mimeType;
  }

  return null;
}

function hasWebpMarker(bytes: Uint8Array): boolean {
  const requiredLength = WEBP_MARKER_OFFSET + WEBP_MARKER.length;
  if (bytes.length < requiredLength) {
    return false;
  }

  return WEBP_MARKER.every(
    (expectedByte, index) => bytes[WEBP_MARKER_OFFSET + index] === expectedByte,
  );
}
