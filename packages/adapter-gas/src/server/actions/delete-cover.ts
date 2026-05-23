// implements FR4 of content-addressable-covers
import {
  buildFolderQuery,
  DRIVE_QUERY_FIELDS,
  ERROR_MESSAGES,
  PROPERTY_KEYS,
} from "../helpers/constants";
import {
  ERROR_CODES,
  jsonError,
  jsonNotInitialized,
  jsonOk,
} from "../helpers/response";
import { getCoverHashes } from "../sheets/goals.sheet";

interface DriveFileEntry {
  id?: string;
  description?: string;
}

export function deleteCover(payload: {
  hash: string;
}): GoogleAppsScript.Content.TextOutput {
  const { hash } = payload;

  if (!hash) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.HASH_REQUIRED);
  }

  const allHashes = getCoverHashes();
  const refCount = allHashes.filter((coverHash) => coverHash === hash).length;

  if (refCount > 0) {
    return jsonOk({ deleted: false, ref_count: refCount });
  }

  const coversFolderId = PropertiesService.getScriptProperties().getProperty(
    PROPERTY_KEYS.COVERS_FOLDER_ID,
  );
  if (!coversFolderId) {
    return jsonNotInitialized();
  }

  const fileList = Drive.Files.list({
    q: buildFolderQuery(coversFolderId),
    fields: DRIVE_QUERY_FIELDS.COVER_FILES,
  });
  const existingFiles: DriveFileEntry[] = fileList.files ?? [];
  const matchedFile = existingFiles.find((file) => file.description === hash);

  if (!matchedFile?.id) {
    return jsonError(
      ERROR_CODES.FILE_NOT_FOUND,
      `${ERROR_MESSAGES.FILE_NOT_FOUND}: ${hash}`,
    );
  }

  try {
    Drive.Files.update({ trashed: true }, matchedFile.id);
    return jsonOk({ deleted: true, ref_count: 0 });
  } catch {
    return jsonError(
      ERROR_CODES.FILE_NOT_FOUND,
      `${ERROR_MESSAGES.FILE_NOT_FOUND}: ${hash}`,
    );
  }
}
