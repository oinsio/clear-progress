import { beforeEach, expect, type Mock, vi } from "vitest";
import { setupFileMocks } from "../../../tests/server/helpers/cover-mocks";
import { FILE_HASH_PREFIX_LENGTH } from "../helpers/constants";

export { DEFAULT_FILES_FOLDER_ID } from "../../../tests/server/helpers/cover-mocks";
export {
  resetScriptProperties,
  setScriptProperty,
} from "../../../tests/server/setup/gas-mocks";

// When computeDigest returns Array(32).fill(0), each byte maps to '00'
export const MOCK_HASH = "00".repeat(32);
export const MOCK_HASH_PREFIX = "0".repeat(FILE_HASH_PREFIX_LENGTH);

export const validPayload = {
  goal_id: "goal-1",
  filename: "cover.jpg",
  mime_type: "image/jpeg",
  data: "base64_encoded_data",
};

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as Mock).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

export function expectErrorResponse(
  expectedError: string,
  expectedMessage?: string,
): void {
  const response = parseResponse();
  expect(response.ok).toBe(false);
  expect(response.error).toBe(expectedError);
  if (expectedMessage !== undefined) {
    expect(response.message).toBe(expectedMessage);
  }
}

export function setupUploadFileTests(): void {
  beforeEach(() => {
    setupFileMocks();
  });
}

export function mockExistingFile(
  fileId = "existing-file-id",
  hash = MOCK_HASH,
): void {
  vi.mocked(Drive.Files.list).mockReturnValue({
    files: [{ id: fileId, description: hash }],
  });
}
