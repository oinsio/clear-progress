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
import type { SingleFileInput, SingleFileResult } from "./upload-file";
import { uploadSingleFile } from "./upload-file";

interface BatchFileInput extends SingleFileInput {
  local_id: string;
}

interface BatchFileResult extends Omit<SingleFileResult, "errorMessage"> {
  local_id: string;
}

export function uploadFiles(payload: {
  files: BatchFileInput[];
}): GoogleAppsScript.Content.TextOutput {
  const { files } = payload;

  if (!Array.isArray(files) || files.length === 0) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.FILES_REQUIRED,
    );
  }

  if (files.length > MAX_FILE_BATCH_SIZE) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.FILES_TOO_MANY,
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
  const existingFiles = fileList.files ?? [];

  const results: BatchFileResult[] = files.map((file) => {
    const result = uploadSingleFile(file, existingFiles, filesFolderId);
    const { errorMessage: _, ...resultWithoutMessage } = result;
    return { ...resultWithoutMessage, local_id: file.local_id };
  });

  return jsonOk({ results });
}
