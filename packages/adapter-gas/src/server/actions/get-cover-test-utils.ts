import { vi } from "vitest";
import {
  resetScriptProperties,
  setScriptProperty,
} from "../../../tests/server/setup/gas-mocks";
import { PROPERTY_KEYS } from "../helpers/constants";

export const HASH_1 = "hash-id-1";
export const HASH_2 = "hash-id-2";
export const MOCK_FILE_ID_1 = "drive-file-id-1";
export const MOCK_FILE_ID_2 = "drive-file-id-2";
export const MOCK_BASE64 = "bW9ja2Jhc2U2NA==";
export const MOCK_MIME_TYPE = "image/jpeg";
export const DEFAULT_COVERS_FOLDER_ID = "covers-folder-id";

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

export function setupDriveMocks(): void {
  vi.clearAllMocks();
  resetScriptProperties();
  setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, DEFAULT_COVERS_FOLDER_ID);
  vi.mocked(Drive.Files.list).mockReturnValue({
    files: [
      { id: MOCK_FILE_ID_1, description: HASH_1 },
      { id: MOCK_FILE_ID_2, description: HASH_2 },
    ],
  } as never);
  vi.mocked(DriveApp.getFileById).mockReturnValue({
    getBlob: () => ({
      getBytes: () => [1, 2, 3],
      getContentType: () => MOCK_MIME_TYPE,
    }),
  } as never);
  vi.mocked(Utilities.base64Encode).mockReturnValue(MOCK_BASE64);
}
