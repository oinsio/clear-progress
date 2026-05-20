import { vi } from "vitest";

export const FILE_ID_1 = "file-id-1";
export const FILE_ID_2 = "file-id-2";
export const MOCK_BASE64 = "bW9ja2Jhc2U2NA==";
export const MOCK_MIME_TYPE = "image/jpeg";

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

export function setupDriveMocks(): void {
  vi.clearAllMocks();
  vi.mocked(Drive.Files.get).mockReturnValue({ trashed: false } as never);
  vi.mocked(DriveApp.getFileById).mockReturnValue({
    getBlob: () => ({
      getBytes: () => [1, 2, 3],
      getContentType: () => MOCK_MIME_TYPE,
    }),
  } as never);
  vi.mocked(Utilities.base64Encode).mockReturnValue(MOCK_BASE64);
}
