import type { BackendType, SyncAdapter } from "@clear-progress/contract";

type GetAccessToken = () => string | null;
type AdapterFactory = (
  url: string,
  getAccessToken: GetAccessToken,
) => SyncAdapter;

const registry = new Map<BackendType, AdapterFactory>();

export function registerAdapter(
  type: BackendType,
  factory: AdapterFactory,
): void {
  registry.set(type, factory);
}

export function createAdapter(
  type: BackendType,
  url: string,
  getAccessToken: GetAccessToken,
): SyncAdapter {
  const factory = registry.get(type);
  if (!factory) {
    throw new Error(`No adapter registered for backend type: ${type}`);
  }
  return factory(url, getAccessToken);
}
