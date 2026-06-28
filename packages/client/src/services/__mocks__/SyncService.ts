import {
  mockPull,
  mockPush,
  mockResetAndPull,
} from "@/app/providers/SyncProvider.test-mocks";

export class SyncService {
  pull = mockPull;
  push = mockPush;
  resetAndPull = mockResetAndPull;
  lastSyncAlerts: unknown[] = [];
}
