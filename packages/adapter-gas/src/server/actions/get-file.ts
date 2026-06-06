// implements FR3 of content-addressable-covers
import {
  buildFolderQuery,
  DRIVE_QUERY_FIELDS,
  ERROR_MESSAGES,
  MAX_FILE_BATCH_SIZE,
  PROPERTY_KEYS,
} from "../helpers/constants";
import {
  ERROR_CODES,
  jsonError,
  jsonNotInitialized,
  jsonOk,
} from "../helpers/response";

interface GetFileResult {
  hash: string;
  mime_type?: string;
  data?: string;
  error?: string;
}

interface DriveFileEntry {
  id?: string;
  description?: string;
}

export function getFile(payload: {
  hashes: string[];
}): GoogleAppsScript.Content.TextOutput {
  const { hashes } = payload;

  if (!Array.isArray(hashes) || hashes.length === 0) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.HASHES_REQUIRED,
    );
  }

  if (hashes.length > MAX_FILE_BATCH_SIZE) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.HASHES_TOO_MANY,
    );
  }

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
  const existingFiles: DriveFileEntry[] = fileList.files ?? [];

  const files: GetFileResult[] = hashes.map((hash) => {
    const matchedFile = existingFiles.find(
      (driveFile) => driveFile.description === hash,
    );

    if (!matchedFile?.id) {
      return { hash, error: ERROR_CODES.FILE_NOT_FOUND };
    }

    try {
      const blob = DriveApp.getFileById(matchedFile.id).getBlob();
      const bytes = blob.getBytes();
      const data = Utilities.base64Encode(bytes);
      const mimeType = blob.getContentType() ?? undefined;
      return { hash, mime_type: mimeType, data };
    } catch (error) {
      console.error(`[get-file] Failed to fetch file for hash ${hash}:`, error);
      return { hash, error: ERROR_CODES.FILE_NOT_FOUND };
    }
  });

  return jsonOk({ files });
}
