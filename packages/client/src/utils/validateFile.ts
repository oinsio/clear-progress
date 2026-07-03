import {
  ALLOWED_FILE_MIME_TYPES,
  detectMimeType,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@clear-progress/contract";

const TEXT_MIME_TYPES = ["text/plain", "text/markdown"] as const;

const ERROR_KEY_UNRECOGNIZED = "attachment.attach.errorUnrecognized";
const ERROR_KEY_TYPE = "attachment.attach.errorType";
const ERROR_KEY_SIZE = "attachment.attach.errorSize";

export type FileValidationResult =
  | { valid: true; file: File }
  | { valid: false; filename: string; errorKey: string };

/**
 * Validates a file through a three-step pipeline:
 * 1. Magic bytes detection to determine effective MIME type
 * 2. MIME type allowlist check
 * 3. File size check
 *
 * Implements FR4, FR5 of attachment-drag-and-drop.
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const fileBuffer = await file.arrayBuffer();
  const detectedType = detectMimeType(fileBuffer);

  let effectiveType: string;
  if (detectedType !== null) {
    effectiveType = detectedType;
  } else if ((TEXT_MIME_TYPES as readonly string[]).includes(file.type)) {
    effectiveType = file.type;
  } else {
    return {
      valid: false,
      filename: file.name,
      errorKey: ERROR_KEY_UNRECOGNIZED,
    };
  }

  const allowedTypes: readonly string[] = ALLOWED_FILE_MIME_TYPES;
  if (!allowedTypes.includes(effectiveType)) {
    return { valid: false, filename: file.name, errorKey: ERROR_KEY_TYPE };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return { valid: false, filename: file.name, errorKey: ERROR_KEY_SIZE };
  }

  return { valid: true, file };
}
