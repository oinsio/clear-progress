import { vi } from "vitest";
import { mockSignOut, mockSilentRefresh } from "../SyncProvider.test-mocks";

export const useAuth = vi.fn(() => ({
  accessToken: "mock-token",
  userEmail: "test@example.com",
  signIn: vi.fn(),
  signOut: mockSignOut,
  silentRefresh: mockSilentRefresh,
}));
