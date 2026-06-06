// implements FR4 of add-file-attachments
// Shared file utilities: extension mapping, MIME validation, magic bytes validation

import {
  ALLOWED_FILE_MIME_TYPES,
  FILE_MAGIC_BYTES,
  TEXT_PLAIN_NULL_CHECK_BYTES,
} from "./constants.ts";

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "text/plain": "txt",
  "application/pdf": "pdf",
};

const DEFAULT_EXTENSION = "bin";
const TEXT_PLAIN_MIME = "text/plain";
const NULL_BYTE = 0x00;

export function getExtensionFromMimeType(mimeType: string): string {
  return MIME_TO_EXTENSION[mimeType] ?? DEFAULT_EXTENSION;
}

/** Implements FR2 of add-file-attachments */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_FILE_MIME_TYPES.includes(mimeType);
}

/**
 * Validates file content by checking magic bytes against the declared MIME type.
 * For text/plain, validates absence of null bytes in the first
 * TEXT_PLAIN_NULL_CHECK_BYTES bytes.
 *
 * Implements FR2 of add-file-attachments.
 */
export function validateMagicBytes(
  fileBytes: Uint8Array,
  mimeType: string,
): boolean {
  if (!isAllowedMimeType(mimeType)) {
    return false;
  }

  if (mimeType === TEXT_PLAIN_MIME) {
    return validateTextPlain(fileBytes);
  }

  return validateBinaryMagicBytes(fileBytes, mimeType);
}

function validateTextPlain(fileBytes: Uint8Array): boolean {
  const bytesToCheck = Math.min(fileBytes.length, TEXT_PLAIN_NULL_CHECK_BYTES);

  for (let i = 0; i < bytesToCheck; i++) {
    if (fileBytes[i] === NULL_BYTE) {
      return false;
    }
  }

  return true;
}

function validateBinaryMagicBytes(
  fileBytes: Uint8Array,
  mimeType: string,
): boolean {
  const signatures = FILE_MAGIC_BYTES[mimeType];
  if (!signatures) {
    return false;
  }

  return signatures.some((signature) => {
    if (fileBytes.length < signature.length) {
      return false;
    }
    return signature.every(
      (expectedByte, index) => fileBytes[index] === expectedByte,
    );
  });
}
