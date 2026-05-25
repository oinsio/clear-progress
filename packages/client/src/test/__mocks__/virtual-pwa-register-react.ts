import { vi } from "vitest";

export function useRegisterSW(_options?: Record<string, unknown>) {
  return {
    needRefresh: [false] as const,
    offlineReady: [false] as const,
    updateServiceWorker: vi.fn(),
  };
}
