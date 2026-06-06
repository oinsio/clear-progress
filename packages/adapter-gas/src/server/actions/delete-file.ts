// implements FR4 of content-addressable-covers, FR6 of add-file-attachments
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
import { getDataHashes } from "../sheets/attachments.sheet";
import { getCoverHashes } from "../sheets/goals.sheet";

interface DriveFileEntry {
  id?: string;
  description?: string;
}

export function deleteFile(payload: {
  hash: string;
}): GoogleAppsScript.Content.TextOutput {
  const { hash } = payload;

  if (!hash) {
    return jsonError(ERROR_CODES.INVALID_PAYLOAD, ERROR_MESSAGES.HASH_REQUIRED);
  }

  const coverHashes = getCoverHashes();
  const attachmentHashes = getDataHashes();
  const coverRefCount = coverHashes.filter(
    (coverHash) => coverHash === hash,
  ).length;
  const attachmentRefCount = attachmentHashes.filter(
    (dataHash) => dataHash === hash,
  ).length;
  const refCount = coverRefCount + attachmentRefCount;

  if (refCount > 0) {
    return jsonOk({ deleted: false, ref_count: refCount });
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
