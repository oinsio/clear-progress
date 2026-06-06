import {
  ALLOWED_FILE_MIME_TYPES,
  FILE_MAGIC_BYTES,
  TEXT_PLAIN_NULL_CHECK_BYTES,
} from "../constants";

const TEXT_PLAIN_MIME = "text/plain" as const;
const NULL_BYTE = 0x00;

/**
 * Validates file content by checking magic bytes (file signature)
 * against known signatures for the declared MIME type.
 *
 * For text/plain, validates absence of null bytes in the first
 * TEXT_PLAIN_NULL_CHECK_BYTES bytes.
 *
 * Implements FR2 of add-file-attachments.
 */
export function validateMagicBytes(
  buffer: ArrayBuffer,
  mimeType: string,
): boolean {
  const isAllowedType = (ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(
    mimeType,
  );
  if (!isAllowedType) {
    return false;
  }

  if (mimeType === TEXT_PLAIN_MIME) {
    return validateTextPlain(buffer);
  }

  return validateBinaryMagicBytes(buffer, mimeType);
}

function validateTextPlain(buffer: ArrayBuffer): boolean {
  const bytesToCheck = Math.min(buffer.byteLength, TEXT_PLAIN_NULL_CHECK_BYTES);
  const bytes = new Uint8Array(buffer, 0, bytesToCheck);

  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === NULL_BYTE) {
      return false;
    }
  }

  return true;
}

function validateBinaryMagicBytes(
  buffer: ArrayBuffer,
  mimeType: string,
): boolean {
  const signatures = FILE_MAGIC_BYTES[mimeType];
  if (!signatures) {
    return false;
  }

  const bytes = new Uint8Array(buffer);

  return signatures.some((signature) => {
    if (bytes.length < signature.length) {
      return false;
    }
    return signature.every(
      (expectedByte, index) => bytes[index] === expectedByte,
    );
  });
}
