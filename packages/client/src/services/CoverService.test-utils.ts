import type { SyncAdapter } from "@clear-progress/contract";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import {
  createMockCoverRepository,
  createMockPendingCoverRepository,
} from "./CoverSyncService-test-utils";
import { createMockSyncAdapter } from "./SyncService.test-helpers";

export const FAKE_ARRAY_BUFFER = new TextEncoder().encode("fake image content")
  .buffer as ArrayBuffer;

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

export interface CoverServiceMocks {
  mockSyncAdapter: SyncAdapter;
  mockCoverRepository: CoverRepository;
  mockPendingCoverRepository: PendingCoverRepository;
}

export function createCoverServiceMocks(
  overrides: {
    syncAdapter?: Partial<SyncAdapter>;
    coverRepository?: Partial<CoverRepository>;
    pendingCoverRepository?: Partial<PendingCoverRepository>;
  } = {},
): CoverServiceMocks {
  return {
    mockSyncAdapter: createMockSyncAdapter(overrides.syncAdapter),
    mockCoverRepository: createMockCoverRepository(overrides.coverRepository),
    mockPendingCoverRepository: createMockPendingCoverRepository(
      overrides.pendingCoverRepository,
    ),
  };
}

export {
  createMockCoverRepository,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
};
