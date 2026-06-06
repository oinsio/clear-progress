import { vi } from "vitest";
import { PROPERTY_KEYS } from "../../../src/server/helpers/constants";
import { resetScriptProperties, setScriptProperty } from "../setup/gas-mocks";

export const DEFAULT_FILES_FOLDER_ID = "files-folder-id";

// JPEG magic bytes: FF D8 FF (as signed GAS bytes: -1, -40, -1)
const JPEG_MAGIC_BYTES = [-1, -40, -1];

export function setupFileMocks(): void {
  vi.clearAllMocks();
  resetScriptProperties();
  setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, DEFAULT_FILES_FOLDER_ID);
  vi.mocked(Utilities.base64Decode).mockReturnValue(JPEG_MAGIC_BYTES);
  vi.mocked(Utilities.computeDigest).mockReturnValue(Array(32).fill(0));
  vi.mocked(Utilities.newBlob).mockReturnValue({} as never);
  vi.mocked(Drive.Files.list).mockReturnValue({ files: [] });
  vi.mocked(Drive.Files.create).mockReturnValue({ id: "new-file-id" });
}
