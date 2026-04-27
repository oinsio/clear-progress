import { ERROR_MESSAGES, MAX_COVER_BATCH_SIZE } from "../helpers/constants";
import { ERROR_CODES, jsonError, jsonOk } from "../helpers/response";

interface GetCoverResult {
  file_id: string;
  mime_type?: string;
  data?: string;
  error?: string;
}

export function getCover(payload: {
  file_ids: string[];
}): GoogleAppsScript.Content.TextOutput {
  const { file_ids } = payload;

  if (!Array.isArray(file_ids) || file_ids.length === 0) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.FILE_IDS_REQUIRED,
    );
  }

  if (file_ids.length > MAX_COVER_BATCH_SIZE) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.FILE_IDS_TOO_MANY,
    );
  }

  const covers: GetCoverResult[] = file_ids.map((fileId) => {
    try {
      const blob = DriveApp.getFileById(fileId).getBlob();
      const bytes = blob.getBytes();
      const data = Utilities.base64Encode(bytes);
      const mimeType = blob.getContentType() ?? undefined;
      return { file_id: fileId, mime_type: mimeType, data };
    } catch (error) {
      console.error(`[get-cover] Failed to fetch file ${fileId}:`, error);
      return { file_id: fileId, error: ERROR_CODES.FILE_NOT_FOUND };
    }
  });

  return jsonOk({ covers });
}
