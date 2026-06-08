import type { SyncAdapter } from "@clear-progress/contract";
import type { FileRepository } from "@/db/repositories/FileRepository";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import {
  createMockFileRepository,
  createMockPendingFileRepository,
} from "./FileSyncService-test-utils";
import { createMockSyncAdapter } from "./SyncService.test-helpers";

// JPEG magic bytes (FF D8 FF) followed by filler to pass magic bytes validation
const jpegMagicBytes = new Uint8Array([
  0xff,
  0xd8,
  0xff,
  0xe0,
  ...new TextEncoder().encode("fake image content"),
]);
export const FAKE_ARRAY_BUFFER = jpegMagicBytes.buffer as ArrayBuffer;

// jsdom does not implement File.prototype.arrayBuffer — add polyfill for tests
Object.defineProperty(File.prototype, "arrayBuffer", {
  value() {
    return Promise.resolve(FAKE_ARRAY_BUFFER);
  },
  configurable: true,
  writable: true,
});

export function createImageFile(
  opts: { name?: string; type?: string; size?: number } = {},
): File {
  const { name = "cover.jpg", type = "image/jpeg", size } = opts;
  const content = size
    ? new Uint8Array(size)
    : new TextEncoder().encode("fake image content");
  return new File([content], name, { type });
}

export interface FileServiceMocks {
  mockSyncAdapter: SyncAdapter;
  mockFileRepository: FileRepository;
  mockPendingFileRepository: PendingFileRepository;
}

export function createFileServiceMocks(
  overrides: {
    syncAdapter?: Partial<SyncAdapter>;
    fileRepository?: Partial<FileRepository>;
    pendingFileRepository?: Partial<PendingFileRepository>;
  } = {},
): FileServiceMocks {
  return {
    mockSyncAdapter: createMockSyncAdapter(overrides.syncAdapter),
    mockFileRepository: createMockFileRepository(overrides.fileRepository),
    mockPendingFileRepository: createMockPendingFileRepository(
      overrides.pendingFileRepository,
    ),
  };
}

export {
  createMockFileRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
};
