import { vi } from "vitest";

export const mockGoogleLogin = vi.fn();

export function createGoogleOAuthMock() {
  return {
    GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useGoogleLogin: vi.fn(
      (options: {
        onSuccess: (response: unknown) => void;
        onError: () => void;
      }) => {
        (globalThis as Record<string, unknown>).__googleLoginOptions = options;
        return mockGoogleLogin;
      },
    ),
  };
}

export function getGoogleLoginOptions() {
  return (globalThis as Record<string, unknown>).__googleLoginOptions as {
    onSuccess: (response: unknown) => void;
    onError: () => void;
  };
}

export function clearGoogleLoginOptions() {
  delete (globalThis as Record<string, unknown>).__googleLoginOptions;
}
