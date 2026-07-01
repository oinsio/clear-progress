import { vi } from "vitest";

export const mockAddAlerts = vi.fn();

export const useAlerts = vi.fn(() => ({
  alerts: [],
  addAlerts: mockAddAlerts,
  dismissAlerts: vi.fn(),
}));
