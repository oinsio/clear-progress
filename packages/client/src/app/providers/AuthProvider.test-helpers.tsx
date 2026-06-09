import { type Mock, vi } from "vitest";
import { clearGoogleLoginOptions } from "@/test/mocks/googleOAuthMock";
import { useAuth } from "./AuthProvider";

export const GAS_CONNECTION_CONFIG = {
  type: "gas" as const,
  url: "https://script.google.com/macros/s/test/exec",
  clientId: "test-client-id",
};

export const SUPABASE_CONNECTION_CONFIG = {
  type: "supabase" as const,
  url: "https://test-project.supabase.co",
  anonKey: "test-anon-key",
};

interface AuthMocks {
  mockGetConnectionConfig: Mock;
  mockGetAccessToken: Mock;
}

export function resetAuthMocks({
  mockGetConnectionConfig,
  mockGetAccessToken,
}: AuthMocks) {
  vi.clearAllMocks();
  mockGetConnectionConfig.mockReturnValue(GAS_CONNECTION_CONFIG);
  mockGetAccessToken.mockReturnValue(null);
  clearGoogleLoginOptions();
}

export function TestConsumer() {
  const { accessToken, userEmail, signIn, signOut, silentRefresh } = useAuth();
  return (
    <div>
      <span data-testid="token">{accessToken ?? "null"}</span>
      <span data-testid="email">{userEmail ?? "null"}</span>
      <button onClick={signIn}>sign-in</button>
      <button onClick={signOut}>sign-out</button>
      <button onClick={silentRefresh}>silent-refresh</button>
    </div>
  );
}

export function ThrowingConsumer() {
  useAuth();
  return <div />;
}
