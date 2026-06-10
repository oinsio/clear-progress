// Shared vi.mock registrations for all ServerSection step definitions.
// IMPORTANT: this module must be imported BEFORE any app modules
// so that vi.mock registrations happen before module resolution.
// implements FR1, FR2, FR3, FR4, FR7, FR9, FR10, FR14, FR15 of simplify-backend-connection
import { vi } from "vitest";

export const mockConnect = vi.fn();
export const mockDisconnect = vi.fn();
export const mockGetSavedConnectionConfig = vi.fn();
export const mockGetSavedConfigForType = vi.fn();
export const mockPing = vi.fn();
export const mockInit = vi.fn();
export const mockFetchSupabaseProviders = vi.fn().mockResolvedValue([]);
export const mockSignInWithOAuth = vi.fn();
export const mockSignInWithOtp = vi.fn();
export const mockVerifyOtp = vi.fn();
export const mockTriggerFullSync = vi.fn();
export const mockUseAuth = vi.fn();
export const mockUseSync = vi.fn();
export const mockUseConnectionConfig = vi.fn();
export const mockUseConnectionStatus = vi.fn();

vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: vi.fn(() => ({ ping: mockPing, init: mockInit })),
}));
vi.mock("@/services/connectionService", () => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  getConnectionConfig: vi.fn(),
  getSavedConnectionConfig: mockGetSavedConnectionConfig,
  getSavedConfigForType: mockGetSavedConfigForType,
}));
vi.mock("@/services/supabaseConnection", () => ({
  fetchSupabaseProviders: mockFetchSupabaseProviders,
}));
vi.mock("@/services/supabaseClientManager", () => ({
  createSupabaseClient: vi.fn(),
  getSupabaseClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      onAuthStateChange: vi.fn(),
    },
  })),
  destroySupabaseClient: vi.fn(),
}));
vi.mock("@/services/defaultServices", () => ({
  getDefaultSyncAdapter: vi.fn(() => ({ ping: vi.fn(), init: mockInit })),
}));
vi.mock("@/services/tokenManager", () => ({
  getAccessToken: vi.fn(() => null),
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => mockUseSync(),
}));
vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: () => mockUseConnectionConfig(),
}));
vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => mockUseConnectionStatus(),
}));
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
