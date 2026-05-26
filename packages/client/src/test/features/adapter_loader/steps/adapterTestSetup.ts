import type { SyncAdapter } from "@clear-progress/contract";
import { vi } from "vitest";

export const mockGasAdapter = {
  ping: vi.fn(),
  init: vi.fn(),
} as unknown as SyncAdapter;
export const mockSupabaseAdapter = {
  ping: vi.fn(),
  init: vi.fn(),
} as unknown as SyncAdapter;
export const mockSupabaseClient = { auth: {}, functions: {} };
export const mockGetConnectionConfig = vi.fn();
export const mockGetAccessToken = vi.fn();

vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: vi.fn(() => mockGasAdapter),
}));

vi.mock("@clear-progress/adapter-supabase", () => ({
  createSupabaseAdapter: vi.fn(() => mockSupabaseAdapter),
}));

vi.mock("@/services/connectionService", () => ({
  getConnectionConfig: mockGetConnectionConfig,
}));

vi.mock("@/services/supabaseClientManager", () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@/services/tokenManager", () => ({
  getAccessToken: mockGetAccessToken,
}));

import "@/test/helpers/mockDefaultServicesDeps";
