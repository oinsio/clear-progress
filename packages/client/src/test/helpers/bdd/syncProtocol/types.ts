import type { SyncAdapter } from "@clear-progress/contract";
import type { SyncService } from "@/services/SyncService";

export type SyncProtocolTestContext = {
  syncAdapter: SyncAdapter;
  syncService: SyncService;
  pushError?: Error;
  pullError?: Error;
  purgeError?: Error;
};
