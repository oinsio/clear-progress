import { vi } from "vitest";

export const mockSchedulePush = vi.fn();

export const useSync = vi.fn(() => ({
  syncVersion: 0,
  syncStatus: "idle",
  pull: vi.fn(),
  push: vi.fn(),
  schedulePush: mockSchedulePush,
}));
