import {
  ALLOWED_FILE_MIME_TYPES,
  FILE_MAGIC_BYTES,
  TEXT_PLAIN_NULL_CHECK_BYTES,
} from "@clear-progress/contract";
import {
  buildFolderQuery,
  DEFAULT_FILE_EXTENSION,
  DRIVE_PERMISSIONS,
  DRIVE_QUERY_FIELDS,
  ERROR_MESSAGES,
  FILE_HASH_PREFIX_LENGTH,
  MAX_FILE_SIZE_BYTES,
  PROPERTY_KEYS,
} from "../helpers/constants";
import {
  ERROR_CODES,
  jsonError,
  jsonNotInitialized,
  jsonOk,
} from "../helpers/response";

export interface SingleFileInput {
  local_id?: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}

// implements FR2 of content-addressable-covers
export interface SingleFileResult {
  local_id?: string;
  goal_id: string;
  data_hash?: string;
  reused?: boolean;
  error?: string;
  errorMessage?: string;
}

interface DriveFileEntry {
  id?: string;
  description?: string;
}

const TEXT_MIME_TYPES = ["text/plain", "text/markdown"] as const;
const NULL_BYTE = 0x00;

/**
 * Validates magic bytes of decoded file content against the declared MIME type.
 * Uses the contract's FILE_MAGIC_BYTES and TEXT_PLAIN_NULL_CHECK_BYTES constants.
 * GAS returns signed byte arrays from base64Decode, so we handle conversion here.
 *
 * Implements FR2 of add-file-attachments (6.4 magic bytes validation).
 */
function validateGasMagicBytes(decoded: number[], mimeType: string): boolean {
  const unsigned = decoded.map((byte) => (byte < 0 ? byte + 256 : byte));

  if ((TEXT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    const bytesToCheck = Math.min(unsigned.length, TEXT_PLAIN_NULL_CHECK_BYTES);
    for (let i = 0; i < bytesToCheck; i++) {
      if (unsigned[i] === NULL_BYTE) return false;
    }
    return true;
  }

  const signatures = FILE_MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some((signature) => {
    if (unsigned.length < signature.length) return false;
    return signature.every(
      (expectedByte, index) => unsigned[index] === expectedByte,
    );
  });
}

// implements FR1, FR2 of add-file-attachments (6.3 MIME validation, 6.4 magic bytes)
export function uploadSingleFile(
  input: SingleFileInput,
  existingFiles: DriveFileEntry[],
  filesFolderId: string,
): SingleFileResult {
  const { filename, mime_type, data, goal_id, local_id } = input;

  if (!(ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(mime_type)) {
    return {
      goal_id,
      local_id,
      error: ERROR_CODES.INVALID_PAYLOAD,
      errorMessage: ERROR_MESSAGES.FILE_INVALID_MIME,
    };
  }

  if (!data) {
    return {
      goal_id,
      local_id,
      error: ERROR_CODES.INVALID_PAYLOAD,
      errorMessage: ERROR_MESSAGES.DATA_REQUIRED,
    };
  }

  const decoded = Utilities.base64Decode(data);
  if (decoded.length > MAX_FILE_SIZE_BYTES) {
    return {
      goal_id,
      local_id,
      error: ERROR_CODES.FILE_TOO_LARGE,
      errorMessage: ERROR_MESSAGES.FILE_TOO_LARGE,
    };
  }

  if (!validateGasMagicBytes(decoded, mime_type)) {
    return {
      goal_id,
      local_id,
      error: ERROR_CODES.INVALID_PAYLOAD,
      errorMessage: ERROR_MESSAGES.FILE_MAGIC_BYTES_MISMATCH,
    };
  }

  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    decoded,
  )
    .map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"))
    .join("");

  for (const file of existingFiles) {
    if (file.description === hash) {
      return { goal_id, local_id, data_hash: hash, reused: true };
    }
  }

  const ext = filename.split(".").pop() ?? DEFAULT_FILE_EXTENSION;
  const newFilename = `${hash.substring(0, FILE_HASH_PREFIX_LENGTH)}.${ext}`;
  const blob = Utilities.newBlob(decoded, mime_type, newFilename);
  const newFile = Drive.Files.create(
    { name: newFilename, description: hash, parents: [filesFolderId] },
    blob,
  );
  const newFileId = newFile.id;
  if (!newFileId) throw new Error("Drive API did not return file id");

  Drive.Permissions.create(
    {
      role: DRIVE_PERMISSIONS.ROLE_READER,
      type: DRIVE_PERMISSIONS.TYPE_ANYONE,
    },
    newFileId,
  );

  return { goal_id, local_id, data_hash: hash, reused: false };
}

export function uploadFile(payload: {
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}): GoogleAppsScript.Content.TextOutput {
  const filesFolderId = PropertiesService.getScriptProperties().getProperty(
    PROPERTY_KEYS.FILES_FOLDER_ID,
  );
  if (!filesFolderId) {
    return jsonNotInitialized();
  }

  const fileList = Drive.Files.list({
    q: buildFolderQuery(filesFolderId),
    fields: DRIVE_QUERY_FIELDS.FOLDER_FILES,
  });
  const existingFiles = fileList.files ?? [];

  const result = uploadSingleFile(payload, existingFiles, filesFolderId);

  if (result.error) {
    return jsonError(result.error, result.errorMessage ?? "");
  }
  return jsonOk({ data_hash: result.data_hash, reused: result.reused });
}
